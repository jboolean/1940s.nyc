export interface OrderTemplateData {
  orderId: string;
  ordersUrl: string;
  trackingUrl?: string;
}

export interface OrderMetadata {
  userId: string;
  orderId: string;
}
