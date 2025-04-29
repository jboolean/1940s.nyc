import TipFrequency from '../../enum/TipFrequency';
import isProduction from '../utils/isProduction';

interface GiftRegistryItem {
  gift: Gift;
  minimumAmount: number;
  frequency: TipFrequency;
  stripePrice: string;
  stripeShippingRate: string;
  stripeShippingPrice: string;
  shippingCountries: string[];
}

// This id should be unique per frequency
export enum Gift {
  TOTE_BAG = 'tote-bag',
}

// This should be the $0 price for the product
const TOTE_BAG_PRICE = isProduction()
  ? 'price_1QtGCuFCLBtNZLVl8SfHC9c5'
  : 'price_1QqH41FCLBtNZLVldOb9KMa3';

const TOTE_BAG_SHIPPING_RATE = isProduction()
  ? 'shr_1QtGHBFCLBtNZLVl84P2gynP'
  : 'shr_1QssVnFCLBtNZLVlK1TZpXet';

const TOTE_BAG_SHIPPING_PRICE = isProduction()
  ? 'price_1R69yOFCLBtNZLVlD6wzaeug'
  : 'price_1QwrXUFCLBtNZLVlsXEdxRYh';

const TOTE_BAG_SHIPPING_COUNTRIES = ['US'];

const TOTE_BAG_DEFAULTS = {
  gift: Gift.TOTE_BAG,
  stripePrice: TOTE_BAG_PRICE,
  stripeShippingRate: TOTE_BAG_SHIPPING_RATE,
  stripeShippingPrice: TOTE_BAG_SHIPPING_PRICE,
  shippingCountries: TOTE_BAG_SHIPPING_COUNTRIES,
} as const;

const GIFT_REGISTRY: GiftRegistryItem[] = [
  {
    minimumAmount: 700,
    frequency: TipFrequency.MONTHLY,
    ...TOTE_BAG_DEFAULTS,
  },
  {
    minimumAmount: 700 * 7,
    frequency: TipFrequency.ONCE,
    ...TOTE_BAG_DEFAULTS,
  },
];

// Validate registry has has unique gift and frequency
const giftFrequencySet = new Set();
GIFT_REGISTRY.forEach((item) => {
  const key = `${item.gift}-${item.frequency}`;
  if (giftFrequencySet.has(key)) {
    throw new Error(`Duplicate gift and frequency in registry: ${key}`);
  }
  giftFrequencySet.add(key);
});

export function getGift(
  gift: Gift,
  frequency: TipFrequency,
  amount: number
): GiftRegistryItem | undefined {
  return GIFT_REGISTRY.find(
    (item) =>
      item.gift === gift &&
      item.frequency === frequency &&
      amount >= item.minimumAmount
  );
}

export function getAllAvailableGifts(): GiftRegistryItem[] {
  return GIFT_REGISTRY;
}
