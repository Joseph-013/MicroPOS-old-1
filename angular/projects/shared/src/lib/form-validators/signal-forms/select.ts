import { validate, SchemaPath } from '@angular/forms/signals';

export function select(
  path: SchemaPath<unknown>,
  allowed: readonly any[],
  config?: {
    min?: number;
    max?: number;
    maxFail?: string;
    minFail?: string;
  },
) {
  return validate(path, ({ value }) => {
    const val = value(); // Access the signal value
    if (val === null || val === undefined || val === '') return null;

    const values = Array.isArray(val) ? val : [val];

    // 1. Validate Enum membership
    if (!values.every((v) => allowed.includes(v))) {
      return {
        kind: 'selectInvalid',
        message: 'Invalid selection',
      };
    }

    // 2. Validate Min
    if (config?.min !== undefined && values.length < config.min) {
      return {
        kind: config.minFail ?? 'selectMin',
        min: config.min,
        actual: values.length,
      };
    }

    // 3. Validate Max
    if (config?.max !== undefined && values.length > config.max) {
      return {
        kind: config.maxFail ?? 'selectMax',
        max: config.max,
        actual: values.length,
      };
    }

    return null;
  });
}
