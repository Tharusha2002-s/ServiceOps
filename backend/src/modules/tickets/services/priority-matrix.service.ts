import { Injectable } from '@nestjs/common';
import { Impact, Urgency, TicketPriority } from '@prisma/client';

export interface SlaTargets {
  priority: TicketPriority;
  responseDueAt: Date;
  resolutionDueAt: Date;
}

@Injectable()
export class PriorityMatrixService {
  /**
   * Deterministic ITIL 3x3 Impact vs Urgency Priority Matrix
   */
  calculatePriority(impact: Impact, urgency: Urgency): TicketPriority {
    if (urgency === Urgency.CRITICAL) {
      if (impact === Impact.ORGANIZATION || impact === Impact.DEPARTMENT) {
        return TicketPriority.CRITICAL_P1;
      }
      return TicketPriority.HIGH_P2;
    }

    if (urgency === Urgency.HIGH) {
      if (impact === Impact.ORGANIZATION) return TicketPriority.CRITICAL_P1;
      if (impact === Impact.DEPARTMENT) return TicketPriority.HIGH_P2;
      return TicketPriority.MEDIUM_P3;
    }

    if (urgency === Urgency.MEDIUM) {
      if (impact === Impact.ORGANIZATION) return TicketPriority.HIGH_P2;
      if (impact === Impact.DEPARTMENT) return TicketPriority.MEDIUM_P3;
      return TicketPriority.LOW_P4;
    }

    // Urgency.LOW
    return TicketPriority.LOW_P4;
  }

  /**
   * Computes SLA response and resolution deadlines from creation timestamp
   */
  calculateSlaTargets(priority: TicketPriority, startTime: Date = new Date()): SlaTargets {
    let responseMinutes = 240; // Default P3: 4h
    let resolutionHours = 24;  // Default P3: 24h

    switch (priority) {
      case TicketPriority.CRITICAL_P1:
        responseMinutes = 15;
        resolutionHours = 2;
        break;
      case TicketPriority.HIGH_P2:
        responseMinutes = 60;
        resolutionHours = 8;
        break;
      case TicketPriority.MEDIUM_P3:
        responseMinutes = 240;
        resolutionHours = 24;
        break;
      case TicketPriority.LOW_P4:
        responseMinutes = 480;
        resolutionHours = 72;
        break;
    }

    const responseDueAt = new Date(startTime.getTime() + responseMinutes * 60 * 1000);
    const resolutionDueAt = new Date(startTime.getTime() + resolutionHours * 60 * 60 * 1000);

    return {
      priority,
      responseDueAt,
      resolutionDueAt,
    };
  }
}

