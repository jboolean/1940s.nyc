import MerchInternalVariant from '../../enum/MerchInternalVariant';
import MerchProvider from '../../enum/MerchProvider';
import type { PrintfileExtension } from '../utils/printfileUtils';

// How a variant's print file is made. The render cron switches on the variant itself; this is what
// groups the prints, for the print variant list and the Stripe webhook's print check.
type MerchKind = 'tote' | 'print';

interface MerchVariantInfo {
  label: string;
  description?: string;
  kind: MerchKind;
  provider: MerchProvider;
  printfileExtension: PrintfileExtension;
}

const lustrePhotoPrintDescription = (width: number, height: number): string =>
  `${width == 8 ? 'An' : 'A'} ${width}x${height}" paper print, professionally printed on archival semi-gloss lustre paper using a silver halide chemical process.`;

// The one list of what we sell: the name and description the customer sees, how it is made, who
// prints it and what the render cron writes. Every variant has to appear here, so a new one cannot
// be sold without all of that.
export const MERCH_CATALOG = {
  [MerchInternalVariant.TOTE_BAG_SMALL]: {
    label: 'Tote bag',
    kind: 'tote',
    provider: MerchProvider.PRINTFUL,
    printfileExtension: 'png',
  },
  [MerchInternalVariant.PRINT_4X6]: {
    label: '4×6 print',
    description: lustrePhotoPrintDescription(4, 6),
    kind: 'print',
    provider: MerchProvider.WHCC,
    printfileExtension: 'jpg',
  },
  [MerchInternalVariant.PRINT_8X12]: {
    label: '8×12 print',
    description: lustrePhotoPrintDescription(8, 12),
    kind: 'print',
    provider: MerchProvider.WHCC,
    printfileExtension: 'jpg',
  },
  [MerchInternalVariant.FRAMED_PRINT_8X12_WALL]: {
    label: '8×12 framed wall print',
    // Note this does not describe the prodigi one accurately, only use when whcc is active
    description:
      'An 8×12 inch lustre print in a ¾" wide smooth matte black MDF frame. No mat. Arrives with a wire hanger, ready to hang.',
    kind: 'print',
    provider: MerchProvider.WHCC,
    printfileExtension: 'jpg',
  },
  [MerchInternalVariant.FRAMED_PRINT_5X7_EASEL]: {
    label: '5×7 framed tabletop print',
    description:
      'A 5×7 inch lustre print in a ¾" wide smooth matte black MDF frame. No mat. Has an easel back so it stands on a desk or table.',
    kind: 'print',
    provider: MerchProvider.WHCC,
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

export function getMerchDescription(
  variant: MerchInternalVariant
): string | undefined {
  const info: MerchVariantInfo | undefined = MERCH_CATALOG[variant];
  return info?.description;
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
