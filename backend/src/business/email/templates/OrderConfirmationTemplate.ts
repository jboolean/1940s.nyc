import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import {
  OrderConfirmationTemplateData,
  OrderMetadata,
} from './OrderEmailTemplateData';
import Senders from './Senders';

class OrderConfirmationTemplate extends EmailTemplate<
  OrderConfirmationTemplateData,
  OrderMetadata
> {
  alias = 'order-confirmation';
  from = Senders.SYSTEM;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new OrderConfirmationTemplate();
