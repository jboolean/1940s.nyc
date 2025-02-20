import EmailTemplate from '../EmailTemplate';
import EmailStreamType from './EmailStreamType';
import {
  MagicLinkMetadata,
  MagicLinkTemplateData,
} from './MagicLinkEmailTemplateData';
import Senders from './Senders';

class MagicLinkTemplate extends EmailTemplate<
  MagicLinkTemplateData,
  MagicLinkMetadata
> {
  alias = 'magic-link';
  from = Senders.SYSTEM;
  streamType = EmailStreamType.TRANSACTIONAL;
}

export default new MagicLinkTemplate();
