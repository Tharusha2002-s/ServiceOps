import { BusinessHoursCalculator } from './business-hours.calculator';

describe('BusinessHoursCalculator', () => {
  let calc: BusinessHoursCalculator;

  beforeEach(() => {
    calc = new BusinessHoursCalculator();
  });

  it('adds calendar minutes directly when businessHoursOnly is false (24x7)', () => {
    const start = new Date(2026, 10, 14, 22, 0, 0); // Saturday 22:00 local
    const due = calc.addBusinessMinutes(start, 90, false);
    expect(due.getTime() - start.getTime()).toBe(90 * 60 * 1000);
  });

  it('adds working minutes continuously within a business day (08:00-18:00)', () => {
    const thuMorning = new Date(2026, 10, 12, 10, 0, 0); // Thursday 10:00
    const due = calc.addBusinessMinutes(thuMorning, 120, true, 8, 18);
    expect(due.getHours()).toBe(12);
    expect(due.getMinutes()).toBe(0);
    expect(due.getDate()).toBe(12);
  });

  it('rolls remaining minutes cleanly over evening cutoff into next morning', () => {
    const thuLate = new Date(2026, 10, 12, 17, 30, 0); // Thursday 17:30 (30m left)
    const due = calc.addBusinessMinutes(thuLate, 60, true, 8, 18);
    expect(due.getDate()).toBe(13); // Friday
    expect(due.getHours()).toBe(8);
    expect(due.getMinutes()).toBe(30);
  });

  it('skips Saturday and Sunday onto Monday 08:00 + duration', () => {
    const satNoon = new Date(2026, 10, 14, 12, 0, 0); // Saturday
    const due = calc.addBusinessMinutes(satNoon, 45, true, 8, 18);
    expect(due.getDay()).toBe(1); // Monday
    expect(due.getHours()).toBe(8);
    expect(due.getMinutes()).toBe(45);
  });
});

