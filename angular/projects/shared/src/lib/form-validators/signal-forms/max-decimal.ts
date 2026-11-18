import { validate, SchemaPath } from '@angular/forms/signals';

export function maxDecimal(
  path: SchemaPath<unknown>,
  maxDecimalPlaces: number,
  config?: { message?: string },
) {
  return validate(path, ({ value }) => {
    const v = value();
    if (v === null || v === undefined) return null;
    const str = String(v);
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return null;
    if (str.length - decimalIndex - 1 <= maxDecimalPlaces) return null;
    return {
      kind: 'maxDecimal',
      message: config?.message ?? `Price cannot have more than ${maxDecimalPlaces} decimal places`,
    };
  });
}
