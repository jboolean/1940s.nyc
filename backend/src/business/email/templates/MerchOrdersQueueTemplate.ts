import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';

type OrdersQueueTemplateData = {
  // What the deployed template reads. The two objects below are what the updated template will
  // use; either is null when there are none of that kind, so its paragraph is left out.
  ordersCount: number;
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
