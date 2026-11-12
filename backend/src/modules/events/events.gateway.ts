import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { RoleName, UserStatus } from '@prisma/client';

interface AuthenticatedSocketData {
  userId: string;
  email: string;
  roles: RoleName[];
}

const STAFF_ROLES: RoleName[] = [
  RoleName.IT_SUPPORT_AGENT,
  RoleName.IT_MANAGER,
  RoleName.SYSTEM_ADMINISTRATOR,
];

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') as string | undefined);

      if (!authToken) {
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('jwt.accessSecret') ||
        'dev_jwt_access_secret_serviceops_minimum_32_characters_long';

      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(authToken, {
        secret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { userRoles: { include: { role: true } } },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        client.disconnect(true);
        return;
      }

      const roles = user.userRoles.map((ur) => ur.role.name);
      const data: AuthenticatedSocketData = {
        userId: user.id,
        email: user.email,
        roles,
      };
      client.data.user = data;

      await client.join(`user:${user.id}`);
      await client.join('authenticated');
      for (const role of roles) {
        await client.join(`role:${role}`);
      }

      this.logger.debug(`WS connected: ${user.email} [${roles.join(', ')}]`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user as AuthenticatedSocketData | undefined;
    if (user) {
      this.logger.debug(`WS disconnected: ${user.email}`);
    }
  }

  @SubscribeMessage('ticket:join')
  async handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ticketId?: string },
  ) {
    const user = client.data?.user as AuthenticatedSocketData | undefined;
    if (!user || !payload?.ticketId) return { ok: false };

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      select: { id: true, requesterId: true },
    });
    if (!ticket) return { ok: false };

    const isStaff = user.roles.some((r) => STAFF_ROLES.includes(r));
    if (!isStaff && ticket.requesterId !== user.userId) {
      return { ok: false };
    }

    await client.join(`ticket:${ticket.id}`);
    return { ok: true, room: `ticket:${ticket.id}` };
  }

  @SubscribeMessage('incident:join')
  async handleJoinIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { incidentId?: string },
  ) {
    const user = client.data?.user as AuthenticatedSocketData | undefined;
    if (!user || !payload?.incidentId) return { ok: false };

    const isStaff = user.roles.some((r) => STAFF_ROLES.includes(r));
    if (!isStaff) return { ok: false };

    await client.join(`incident:${payload.incidentId}`);
    return { ok: true, room: `incident:${payload.incidentId}` };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToRoles(roles: RoleName[], event: string, payload: unknown) {
    if (!this.server || roles.length === 0) return;
    let emitter = this.server.to(`role:${roles[0]}`);
    for (let i = 1; i < roles.length; i++) {
      emitter = emitter.to(`role:${roles[i]}`);
    }
    emitter.emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(room).emit(event, payload);
  }

  emitToAuthenticated(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to('authenticated').emit(event, payload);
  }
}
