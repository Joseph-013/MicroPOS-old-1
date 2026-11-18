import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decodeDbFloat',
})
export class DecodeDbFloatPipe implements PipeTransform {
  /**
   * Converts a database integer (e.g., 101) to a decimal float (e.g., 1.01).
   * @param value The value from the database.
   * @param scale The divisor (defaults to 100).
   * @returns The converted number, or 0 if the value is null/undefined.
   */
  transform(value: unknown, scale: number = 100): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : (value as number);

    if (isNaN(numericValue)) {
      return 0;
    }

    // Using division by scale to convert 101 -> 1.01
    return numericValue / scale;
  }
}
