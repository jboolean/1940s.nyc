import axios from 'axios';
import { MerchInternalVariant } from 'shared/utils/merch/Order';
import api from 'utils/api';

export interface PrintFrame {
  // WHCC's moulding id, such as gallery_fine_black.
  moulding: string;
  printShortSideInches: number;
  printLongSideInches: number;
}

export interface PrintProductApiResponse {
  variant: MerchInternalVariant;
  label: string;
  priceAmount: number;
  description?: string;
  frame?: PrintFrame;
}

export function getAvailablePrintProducts(): Promise<
  PrintProductApiResponse[]
> {
  return api
    .get<PrintProductApiResponse[]>('/print-checkout/available-products')
    .then((resp) => resp.data);
}

export interface PrintCheckoutItem {
  photoIdentifier: string;
  variant: MerchInternalVariant;
  quantity: number;
  colorize: boolean;
}

export async function createPrintCheckoutSession(
  items: PrintCheckoutItem[],
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const resp = await api.post<{ sessionId: string; url: string }>(
    '/print-checkout/session',
    { items, successUrl, cancelUrl },
    { timeout: 20000 }
  );
  return resp.data.url;
}

export const CHECKOUT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// A 400 carries a message written for the customer. Anything else gets the generic one.
export function getCheckoutErrorMessage(error: unknown): string {
  if (
    axios.isAxiosError<{ error?: unknown }>(error) &&
    error.response?.status === 400
  ) {
    const message = error.response.data?.error;
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return CHECKOUT_ERROR_MESSAGE;
}
