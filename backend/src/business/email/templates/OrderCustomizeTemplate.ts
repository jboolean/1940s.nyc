import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import { OrderMetadata, OrderTemplateData } from './OrderEmailTemplateData';
import Senders from './Senders';

class OrderCustomizeTemplate extends EmailTemplate<
  OrderTemplateData,
  OrderMetadata
> {
  alias = 'order-customize';
  from = Senders.SYSTEM;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new OrderCustomizeTemplate();
