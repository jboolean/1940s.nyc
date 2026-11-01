import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';

// How a variant's print file is made, which is what the render cron branches on.
type MerchKind = 'tote' | 'print';

interface MerchVariantInfo {
  label: string;
  kind: MerchKind;
  provider: MerchProvider;
}

// The one list of what we sell: the name the customer sees, how it is made, and who prints it.
// Every variant has to appear here, so a new one cannot be sold without a label and a provider.
export const MERCH_CATALOG = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: {
    label: 'Tote bag',
    kind: 'tote',
    provider: MerchProvider.PRINTFUL,
  },
  [MerchInternalVariant.PRINT_HPR_4X6]: {
    label: '4×6 print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
  },
  [MerchInternalVariant.PRINT_HPR_8X12]: {
    label: '8×12 print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
  },
  [MerchInternalVariant.PRINT_FAP_8X12_FRAMED]: {
    label: '8×12 framed print',
    kind: 'print',
    provider: MerchProvider.PRODIGI,
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

export function getMerchProvider(variant: MerchInternalVariant): MerchProvider {
  return MERCH_CATALOG[variant].provider;
}
