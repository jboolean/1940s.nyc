export interface OrderTemplateData {
  orderId: string;
  ordersUrl: string;
  trackingUrl?: string;
}

export interface OrderConfirmationTemplateData extends OrderTemplateData {
  // For example "2 × 8×12 in print (AI colorized)"
  itemsSummary: string;
}

export interface OrderMetadata {
  userId: string;
  orderId: string;
}
