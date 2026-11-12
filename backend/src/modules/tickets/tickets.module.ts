import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PriorityMatrixService } from './services/priority-matrix.service';
import { SlaModule } from '../sla/sla.module';

@Module({
  imports: [SlaModule],
  controllers: [TicketsController],
  providers: [TicketsService, PriorityMatrixService],
  exports: [TicketsService, PriorityMatrixService],
})
export class TicketsModule {}
