import { PriorityMatrixService } from './priority-matrix.service';
import { Impact, Urgency, TicketPriority } from '@prisma/client';

describe('PriorityMatrixService (ITIL 3x4 Impact x Urgency Matrix)', () => {
  let service: PriorityMatrixService;

  beforeEach(() => {
    service = new PriorityMatrixService();
  });

  it('assigns CRITICAL_P1 for CRITICAL urgency affecting ORGANIZATION or DEPARTMENT', () => {
    expect(service.calculatePriority(Impact.ORGANIZATION, Urgency.CRITICAL)).toBe(
      TicketPriority.CRITICAL_P1,
    );
    expect(service.calculatePriority(Impact.DEPARTMENT, Urgency.CRITICAL)).toBe(
      TicketPriority.CRITICAL_P1,
    );
  });

  it('assigns HIGH_P2 for CRITICAL urgency affecting a single USER', () => {
    expect(service.calculatePriority(Impact.USER, Urgency.CRITICAL)).toBe(TicketPriority.HIGH_P2);
  });

  it('scales HIGH urgency across ORGANIZATION (P1), DEPARTMENT (P2), USER (P3)', () => {
    expect(service.calculatePriority(Impact.ORGANIZATION, Urgency.HIGH)).toBe(
      TicketPriority.CRITICAL_P1,
    );
    expect(service.calculatePriority(Impact.DEPARTMENT, Urgency.HIGH)).toBe(
      TicketPriority.HIGH_P2,
    );
    expect(service.calculatePriority(Impact.USER, Urgency.HIGH)).toBe(TicketPriority.MEDIUM_P3);
  });

  it('scales MEDIUM urgency and assigns LOW_P4 for all LOW urgency combinations', () => {
    expect(service.calculatePriority(Impact.ORGANIZATION, Urgency.MEDIUM)).toBe(
      TicketPriority.HIGH_P2,
    );
    expect(service.calculatePriority(Impact.DEPARTMENT, Urgency.MEDIUM)).toBe(
      TicketPriority.MEDIUM_P3,
    );
    expect(service.calculatePriority(Impact.USER, Urgency.MEDIUM)).toBe(TicketPriority.LOW_P4);

    expect(service.calculatePriority(Impact.ORGANIZATION, Urgency.LOW)).toBe(TicketPriority.LOW_P4);
    expect(service.calculatePriority(Impact.DEPARTMENT, Urgency.LOW)).toBe(TicketPriority.LOW_P4);
    expect(service.calculatePriority(Impact.USER, Urgency.LOW)).toBe(TicketPriority.LOW_P4);
  });

  it('computes deterministic SLA response and resolution target windows', () => {
    const start = new Date('2026-11-12T09:00:00.000Z');
    const p1 = service.calculateSlaTargets(TicketPriority.CRITICAL_P1, start);
    expect(p1.responseDueAt.getTime() - start.getTime()).toBe(15 * 60 * 1000);
    expect(p1.resolutionDueAt.getTime() - start.getTime()).toBe(120 * 60 * 1000);

    const p4 = service.calculateSlaTargets(TicketPriority.LOW_P4, start);
    expect(p4.responseDueAt.getTime() - start.getTime()).toBe(480 * 60 * 1000);
    expect(p4.resolutionDueAt.getTime() - start.getTime()).toBe(72 * 60 * 60 * 1000);
  });
});

