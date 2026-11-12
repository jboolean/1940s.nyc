import MerchOrder from '../../../entities/MerchOrder';
import MerchOrderItem from '../../../entities/MerchOrderItem';
import ShippingAddress from '../../../entities/ShippingAddress';
import MerchOrderFulfillmentState from '../../../enum/MerchOrderFulfillmentState';
import required from '../../utils/required';
import {
  PRINTFUL_SHIPPING_METHOD_METADATA_KEY,
  quotePrintfulShipping,
} from '../printfulShipping';
import * as PrintfulService from '../PrintfulService';
import FulfillmentProvider, {
  CreatedProviderOrder,
} from './FulfillmentProvider';

const PrintfulFulfillmentProvider: FulfillmentProvider = {
  requiresReview: true,

  quoteShippingOptions: quotePrintfulShipping,
  shippingMethodMetadataKey: PRINTFUL_SHIPPING_METHOD_METADATA_KEY,
  defaultShippingMethod: 'STANDARD',

  async createOrder(
    merchOrderId: number,
    shippingAddress: ShippingAddress,
    shippingMethod?: string
  ): Promise<CreatedProviderOrder> {
    const printfulOrder = await PrintfulService.createEmptyOrder(
      merchOrderId,
      shippingAddress,
      shippingMethod
    );
    return {
      providerOrderId: String(printfulOrder.id),
      fulfillmentState: MerchOrderFulfillmentState.DRAFT,
    };
  },

  async addItemToOrder(item: MerchOrderItem): Promise<void> {
    await PrintfulService.addItemToOrder(item);
  },

  async submitOrderForFulfillment(
    order: MerchOrder
  ): Promise<CreatedProviderOrder> {
    await PrintfulService.submitOrderForFulfillment(
      Number(required(order.providerOrderId, 'providerOrderId'))
    );
    return {};
  },
};

export default PrintfulFulfillmentProvider;
