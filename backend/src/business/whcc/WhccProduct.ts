export interface WhccProduct {
  // The catalog ref, case-sensitive.
  productRef: string;
  // Field name to the id of the chosen value, for every field that applies to the product.
  selections: Record<string, string>;
}
