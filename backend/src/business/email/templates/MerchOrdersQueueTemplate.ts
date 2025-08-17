import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';

type OrdersQueueTemplateData = {
  ordersCount: number;
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
