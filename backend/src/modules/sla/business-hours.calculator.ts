import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessHoursCalculator {
  private readonly defaultStartHour = 8;  // 08:00 AM
  private readonly defaultEndHour = 18;   // 06:00 PM

  /**
   * Checks if a date falls on a weekend (Saturday or Sunday)
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  /**
   * Adds business minutes to a starting timestamp, advancing through nights and weekends.
   * If businessHoursOnly is false (e.g. 24x7 P1 incidents), it performs standard 24/7 calendar addition.
   */
  addBusinessMinutes(
    startDate: Date,
    minutesToAdd: number,
    businessHoursOnly: boolean = true,
    startHour: number = this.defaultStartHour,
    endHour: number = this.defaultEndHour,
  ): Date {
    if (!businessHoursOnly) {
      return new Date(startDate.getTime() + minutesToAdd * 60 * 1000);
    }

    let current = new Date(startDate);
    let remainingMinutes = minutesToAdd;

    // Fast-forward if start date is outside business hours or on a weekend
    current = this.adjustToNextWorkingHour(current, startHour, endHour);

    while (remainingMinutes > 0) {
      const dayEnd = new Date(current);
      dayEnd.setHours(endHour, 0, 0, 0);

      const availableMinutesToday = Math.max(
        0,
        Math.floor((dayEnd.getTime() - current.getTime()) / (1000 * 60)),
      );

      if (remainingMinutes <= availableMinutesToday) {
        current = new Date(current.getTime() + remainingMinutes * 60 * 1000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= availableMinutesToday;
        // Advance to start of next working day
        current.setDate(current.getDate() + 1);
        current.setHours(startHour, 0, 0, 0);
        current = this.adjustToNextWorkingHour(current, startHour, endHour);
      }
    }

    return current;
  }

  /**
   * Ensures timestamp falls within a business day between startHour and endHour.
   */
  private adjustToNextWorkingHour(date: Date, startHour: number, endHour: number): Date {
    const result = new Date(date);

    while (this.isWeekend(result)) {
      result.setDate(result.getDate() + 1);
      result.setHours(startHour, 0, 0, 0);
    }

    if (result.getHours() < startHour) {
      result.setHours(startHour, 0, 0, 0);
    } else if (result.getHours() >= endHour) {
      result.setDate(result.getDate() + 1);
      result.setHours(startHour, 0, 0, 0);
      return this.adjustToNextWorkingHour(result, startHour, endHour);
    }

    return result;
  }
}

