import MerchOrder from '../../../entities/MerchOrder';
import { buildConfiguredProducts } from '../../whcc/buildConfiguredProducts';
import {
  buildWhccConfiguredProducts,
  buildWhccSubmission,
  getWhccReference,
} from '../../whcc/buildWhccSubmission';
import * as WhccClient from '../../whcc/whccApi';
import {
  quoteWhccShipping,
  WHCC_SHIPPING_METHOD_METADATA_KEY,
} from '../../whcc/whccShipping';
import { syncSubmission } from '../../whcc/WhccCallbackService';
import isProduction from '../../utils/isProduction';
import required from '../../utils/required';
import FulfillmentProvider, {
  CreatedProviderOrder,
} from './FulfillmentProvider';

// Approving an order runs this inside a request with a 20 second limit.
const SUBMIT_BUDGET_MS = 15_000;

// WHCC has no draft orders, so nothing is created there until the order is submitted.
const WhccFulfillmentProvider: FulfillmentProvider = {
  requiresReview: true,

  quoteShippingOptions: quoteWhccShipping,
  shippingMethodMetadataKey: WHCC_SHIPPING_METHOD_METADATA_KEY,
  defaultShippingMethod: 'dropship_lowest_cost',

  createOrder() {
    return Promise.resolve({});
  },

  addItemToOrder() {
    return Promise.resolve();
  },

  async submitOrderForFulfillment(
    order: MerchOrder
  ): Promise<CreatedProviderOrder> {
    if (order.providerOrderId) {
      return {};
    }
    // Orders on the live API cost real money.
    if (isProduction() && process.env.WHCC_LIVE_ORDERS_ENABLED !== 'true') {
      throw new Error(
        'Refusing to create a WHCC submission on the live API: WHCC_LIVE_ORDERS_ENABLED is not true'
      );
    }

    // A retry builds new configured products, so its body differs from an earlier submit and the
    // idempotency key cannot recognise it. The reference can: use it to find a submission whose
    // response was lost.
    const deadline = Date.now() + SUBMIT_BUDGET_MS;
    const { submissions } = await WhccClient.listSubmissions(
      { reference: getWhccReference(order.id) },
      deadline
    );
    if (submissions.length) {
      return { providerOrderId: submissions[0].id };
    }

    const built = await buildConfiguredProducts(
      buildWhccConfiguredProducts(order),
      deadline
    );
    const submission = buildWhccSubmission(
      order,
      built.map((b) => b.configuredProductId)
    );

    const calculation = await WhccClient.calculate(submission, deadline);
    if (!calculation.validation.isValidForSubmit) {
      throw new Error(`WHCC says order ${order.id} is not valid to submit`);
    }

    const { id } = await WhccClient.submit(
      submission,
      getWhccReference(order.id),
      deadline
    );
    return { providerOrderId: id };
  },

  syncSubmittedOrder: syncSubmission,

  async cancelSubmittedOrder(order: MerchOrder): Promise<void> {
    const submission = await WhccClient.getSubmission(
      required(order.providerOrderId, 'providerOrderId')
    );
    for (const whccOrder of submission.orders ?? []) {
      const url = whccOrder.actions?.fulfillment?.url;
      if (!url || whccOrder.status === 'order_canceled') {
        continue;
      }
      for (const { id } of (await WhccClient.listFulfillmentOrders(url))
        .items) {
        await WhccClient.cancelFulfillmentOrder(id);
      }
    }
  },
};

export default WhccFulfillmentProvider;
