import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { MailService } from './mail.service';
import {
  DeliveryStatus,
  NotificationChannel,
  NotificationType,
  RoleName,
  UserStatus,
} from '@prisma/client';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export interface DispatchNotificationParams {
  recipientIds: string[];
  actorId?: string;
  notifyActor?: boolean;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: 'TICKET' | 'INCIDENT';
  entityId?: string;
  linkUrl?: string;
  sendEmail?: boolean;
}

interface EmailJobData {
  deliveryId: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  linkUrl?: string;
}

const QUEUE_NAME = 'serviceops-notifications';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private queue: Queue<EmailJobData> | null = null;
  private worker: Worker<EmailJobData> | null = null;
  private redisAvailable = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password');

    if (process.env.REDIS_ENABLED === 'false') {
      this.logger.log('REDIS_ENABLED=false; using in-process async email queue worker.');
      return;
    }

    const probe = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      connectTimeout: 450,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    probe.on('error', () => {
      // Handled via probe failure fallback below
    });

    try {
      await probe.connect();
      const pong = await probe.ping();
      await probe.quit();

      if (pong === 'PONG') {
        const connection = { host, port, password, maxRetriesPerRequest: null };
        this.queue = new Queue<EmailJobData>(QUEUE_NAME, {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 200,
            removeOnFail: 200,
          },
        });
        this.worker = new Worker<EmailJobData>(
          QUEUE_NAME,
          async (job: Job<EmailJobData>) => {
            await this.processEmailDelivery(job.data);
          },
          { connection, concurrency: 5 },
        );
        this.worker.on('failed', (job, err) => {
          this.logger.warn(`BullMQ email job ${job?.id} failed: ${err.message}`);
        });
        this.redisAvailable = true;
        this.logger.log(`BullMQ notifications queue & worker active via Redis (${host}:${port})`);
      }
    } catch {
      try {
        probe.disconnect();
      } catch {
        // Ignore cleanup errors
      }
      this.redisAvailable = false;
      this.logger.warn(
        `Redis unavailable at ${host}:${port} — falling back cleanly to non-blocking in-process async delivery worker.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  /**
   * Dispatch in-app + WebSocket + queued async email notification for recipients.
   */
  async dispatch(params: DispatchNotificationParams) {
    const uniqueRecipientIds = Array.from(
      new Set(
        params.recipientIds.filter((id) => {
          if (!id) return false;
          if (!params.notifyActor && params.actorId && id === params.actorId) return false;
          return true;
        }),
      ),
    );

    if (uniqueRecipientIds.length === 0) return [];

    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueRecipientIds },
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const createdNotifications = [];

    for (const recipient of recipients) {
      const sendEmail = params.sendEmail !== false;
      const now = new Date();

      const notification = await this.prisma.notification.create({
        data: {
          recipientId: recipient.id,
          type: params.type,
          title: params.title,
          message: params.message,
          entityType: params.entityType,
          entityId: params.entityId,
          linkUrl: params.linkUrl,
          deliveries: {
            create: [
              {
                channel: NotificationChannel.IN_APP,
                status: DeliveryStatus.SENT,
                attempts: 1,
                sentAt: now,
              },
              ...(sendEmail
                ? [
                    {
                      channel: NotificationChannel.EMAIL,
                      status: DeliveryStatus.PENDING,
                      attempts: 0,
                    },
                  ]
                : []),
            ],
          },
        },
        include: { deliveries: true },
      });

      createdNotifications.push(notification);

      // Push real-time in-app notification over authenticated WebSocket
      this.eventsGateway.emitToUser(recipient.id, 'notification:new', {
        notification,
      });

      // Enqueue email outside request cycle
      if (sendEmail) {
        const emailDelivery = notification.deliveries.find(
          (d) => d.channel === NotificationChannel.EMAIL,
        );
        if (emailDelivery) {
          await this.enqueueEmail({
            deliveryId: emailDelivery.id,
            recipientEmail: recipient.email,
            recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),
            title: params.title,
            message: params.message,
            linkUrl: params.linkUrl,
          });
        }
      }
    }

    return createdNotifications;
  }

  /**
   * Convenience helper to notify all active members of given roles.
   */
  async notifyRoles(
    roles: RoleName[],
    params: Omit<DispatchNotificationParams, 'recipientIds'> & { extraRecipientIds?: string[] },
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        userRoles: {
          some: { role: { name: { in: roles } } },
        },
      },
      select: { id: true },
    });

    const recipientIds = [
      ...users.map((u) => u.id),
      ...(params.extraRecipientIds ?? []),
    ];

    return this.dispatch({
      ...params,
      recipientIds,
    });
  }

  private async enqueueEmail(data: EmailJobData) {
    if (this.redisAvailable && this.queue) {
      await this.queue.add('deliver-email', data);
      return;
    }

    // In-process async queue fallback when Redis is absent in local dev
    setTimeout(() => {
      void this.executeWithRetry(data, 1);
    }, 15);
  }

  private async executeWithRetry(data: EmailJobData, attempt: number) {
    try {
      await this.processEmailDelivery(data);
    } catch (error: any) {
      if (attempt < 3) {
        setTimeout(() => {
          void this.executeWithRetry(data, attempt + 1);
        }, attempt * 500);
      } else {
        this.logger.warn(
          `Async email delivery ${data.deliveryId} failed after ${attempt} attempts: ${error?.message || 'unknown error'}`,
        );
      }
    }
  }

  async processEmailDelivery(data: EmailJobData) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: data.deliveryId },
    });
    if (!delivery) return;

    const nextAttempt = delivery.attempts + 1;

    try {
      await this.mailService.sendEmail({
        to: data.recipientEmail,
        subject: `[ServiceOps] ${data.title}`,
        text: `Hello ${data.recipientName || 'Colleague'},\n\n${data.title}\n${data.message}\n\n— ServiceOps Enterprise ITSM`,
      });

      await this.prisma.notificationDelivery.update({
        where: { id: data.deliveryId },
        data: {
          status: DeliveryStatus.SENT,
          attempts: nextAttempt,
          lastError: null,
          sentAt: new Date(),
        },
      });
    } catch (err: any) {
      await this.prisma.notificationDelivery.update({
        where: { id: data.deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          attempts: nextAttempt,
          lastError: err?.message || 'SMTP dispatch failed',
        },
      });
      throw err;
    }
  }

  async findMyNotifications(userId: string, unreadOnly = false, limit = 50) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          recipientId: userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        include: {
          deliveries: {
            select: {
              id: true,
              channel: true,
              status: true,
              attempts: true,
              sentAt: true,
              lastError: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 100),
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.isRead) return existing;

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { updatedCount: result.count };
  }

  async getDeliveryLogs(limit = 50) {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      include: {
        notification: {
          select: {
            id: true,
            type: true,
            title: true,
            recipient: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return {
      queueBackend: this.redisAvailable ? 'bullmq-redis' : 'in-process-async',
      deliveries,
    };
  }
}

