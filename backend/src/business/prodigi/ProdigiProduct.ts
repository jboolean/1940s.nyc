import type { Sizing } from 'prodigi-print-api';

export interface ProdigiProduct {
  sku: string;
  attributes: Record<string, string>;
  sizing: Sizing;
}
