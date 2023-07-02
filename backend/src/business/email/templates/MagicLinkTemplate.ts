import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import Senders from './Senders';
import {
  MagicLinkTemplateData,
  MagicLinkMetadata,
} from './MagicLinkEmailTemplateData';

class MagicLinkTemplate extends EmailTemplate<
  MagicLinkTemplateData,
  MagicLinkMetadata
> {
  alias = 'magic-link';
  from = Senders.PERSONAL;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new MagicLinkTemplate();
