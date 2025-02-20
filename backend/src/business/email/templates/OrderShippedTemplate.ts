import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import { OrderMetadata, OrderTemplateData } from './OrderEmailTemplateData';
import Senders from './Senders';

class OrderShippedTemplate extends EmailTemplate<
  OrderTemplateData,
  OrderMetadata
> {
  alias = 'order-shipped';
  from = Senders.SYSTEM;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new OrderShippedTemplate();
