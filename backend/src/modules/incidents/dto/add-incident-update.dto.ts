import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddIncidentUpdateDto {
  @ApiProperty({ description: 'Timeline update message or finding', example: 'Traffic rerouted to secondary controller.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class LinkTicketDto {
  @ApiProperty({ description: 'Ticket ID or TicketNumber to associate with incident' })
  @IsString()
  @IsNotEmpty()
  ticketIdentifier: string;
}

