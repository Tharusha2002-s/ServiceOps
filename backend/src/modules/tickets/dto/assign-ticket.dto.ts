import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiProperty({ description: 'User ID of the assigned IT Support Agent' })
  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;
}

