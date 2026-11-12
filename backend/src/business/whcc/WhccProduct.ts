export interface WhccProduct {
  // Case-sensitive catalog ref.
  productRef: string;
  // Field name to chosen value id, for every field the product has.
  selections: Record<string, string>;
}
