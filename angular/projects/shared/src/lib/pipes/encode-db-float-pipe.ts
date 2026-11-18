import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'encodeDbFloat',
})
export class EncodeDbFloatPipe implements PipeTransform {
  transform(value: unknown, scale: number = 100): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : (value as number);

    if (isNaN(numericValue)) {
      return 0;
    }

    // FIX: Normalize the float string to 2 decimal places first
    // to strip out trailing binary noise (e.g., 37.950000000000005 -> "37.95")
    const fixedString = numericValue.toFixed(2);
    const sanitizedNumber = parseFloat(fixedString);

    return Math.round(sanitizedNumber * scale);
  }
}
