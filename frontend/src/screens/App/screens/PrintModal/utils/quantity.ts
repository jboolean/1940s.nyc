export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

// The typed text as a whole number, or NaN while it is empty or not a number.
export function parseQuantity(text: string): number {
  return /^\d+$/.test(text) ? parseInt(text, 10) : NaN;
}

export function isValidQuantity(quantity: number): boolean {
  return quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
}
