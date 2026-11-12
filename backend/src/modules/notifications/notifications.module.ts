import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './mail.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [MailService, NotificationsService],
  exports: [NotificationsService, MailService],
})
export class NotificationsModule {}

