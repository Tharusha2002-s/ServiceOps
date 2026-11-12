import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaMonitorService } from './sla-monitor.service';
import { BusinessHoursCalculator } from './business-hours.calculator';

@Module({
  controllers: [SlaController],
  providers: [SlaService, SlaMonitorService, BusinessHoursCalculator],
  exports: [SlaService, SlaMonitorService, BusinessHoursCalculator],
})
export class SlaModule {}

