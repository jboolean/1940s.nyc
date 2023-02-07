import isNil from 'lodash/isNil';

class RequiredError extends Error {
  constructor(field: string) {
    super(`Required: ${field}`);
  }
}

/**
 * Returns input or throws if nil
 * @param v Returns
 * @param field name of field for error message
 * @returns v
 * @throws RequiredError
 */
export default function required<T>(v: T | null | undefined, field: string): T {
  if (isNil(v)) {
    throw new RequiredError(field);
  }
  return v;
}
