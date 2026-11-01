import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';

type OrdersQueueTemplateData = {
  // Null when there are none of that kind, so the template can leave that paragraph out.
  orders: { count: number } | null;
  exceptions: { count: number } | null;
  reviewMerchUrl: string;
};

class MerchOrdersQueueTemplate extends EmailTemplate<
  OrdersQueueTemplateData,
  Record<string, never>
> {
  alias = 'merch-orders-queue';
  from = Senders.SYSTEM;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new MerchOrdersQueueTemplate();
