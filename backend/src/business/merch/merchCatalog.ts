import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import type { PrintfileExtension } from '../utils/printfileUtils';

// How a variant's print file is made. The render cron switches on the variant itself; this is what
// groups the prints, for the print variant list and the Stripe webhook's print check.
type MerchKind = 'tote' | 'print';

interface MerchVariantInfo {
  label: string;
  kind: MerchKind;
  provider: MerchProvider;
  printfileExtension: PrintfileExtension;
}

// The one list of what we sell: the name the customer sees, how it is made, who prints it and what
// the render cron writes. Every variant has to appear here, so a new one cannot be sold without all
// of that.
export const MERCH_CATALOG = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: {
    label: 'Tote bag',
    kind: 'tote',
    provider: MerchProvider.PRINTFUL,
    printfileExtension: 'png',
  },
  [MerchInternalVariant.PRINT_HPR_4X6]: {
    label: '4×6 print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
    printfileExtension: 'jpg',
  },
  [MerchInternalVariant.PRINT_HPR_8X12]: {
    label: '8×12 print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
    printfileExtension: 'jpg',
  },
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: {
    label: '8×12 framed print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
    printfileExtension: 'jpg',
  },
} as const satisfies Record<MerchInternalVariant, MerchVariantInfo>;

// The print variants, read back off the catalog so a new print joins the print paths by itself.
export type PrintVariant = {
  [V in MerchInternalVariant]: (typeof MERCH_CATALOG)[V]['kind'] extends 'print'
    ? V
    : never;
}[MerchInternalVariant];

export function isPrintVariant(
  variant: MerchInternalVariant
): variant is PrintVariant {
  // The fallback mirrors getMerchLabel: a row can name a variant this version no longer sells.
  return MERCH_CATALOG[variant]?.kind === 'print';
}

export const PRINT_VARIANTS: PrintVariant[] = (
  Object.keys(MERCH_CATALOG) as MerchInternalVariant[]
).filter(isPrintVariant);

export function getMerchLabel(variant: MerchInternalVariant): string {
  return MERCH_CATALOG[variant]?.label ?? variant;
}

// Unlike the display lookups, this has no fallback: the provider prints and charges for the order,
// and a variant missing from the catalog is one nobody can fulfil.
export function getMerchProvider(variant: MerchInternalVariant): MerchProvider {
  const provider = MERCH_CATALOG[variant]?.provider;
  if (!provider) {
    throw new Error(`No provider for variant ${variant}`);
  }
  return provider;
}

export function getPrintfileExtensionForVariant(
  variant: MerchInternalVariant
): PrintfileExtension {
  return MERCH_CATALOG[variant]?.printfileExtension ?? 'png';
}
