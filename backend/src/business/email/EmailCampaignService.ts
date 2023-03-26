import { getConnection, getRepository, LessThan } from 'typeorm';
import CampaignSend from '../../entities/CampaignSend';
import MailingListMember from '../../entities/MailingListMember';
import CampaignSendStatus from '../../enum/CampaignSendStatus';
import EmailService from './EmailService';
import EmailStreamType from './templates/EmailStreamType';
import Senders from './templates/Senders';

const BULK_SEND_LIMIT = 100;

// For sending email marketing newsletters/blast campaigns
class EmailCampaignService {
  async enqueueEmailCampaign(
    template: string,
    livemode: boolean,
    sendOn: Date
  ): Promise<void> {
    if (sendOn < new Date()) {
      throw new Error('Cannot schedule email campaign in the past');
    }

    const connection = getConnection();
    await connection.query(
      `
      INSERT INTO campaign_sends (address, template, livemode, send_on, status)
      SELECT address, $1, $2, $3, $4 FROM mailing_list_members
      ON CONFLICT DO NOTHING
    `,
      [template, livemode, sendOn, CampaignSendStatus.PENDING]
    );
  }

  async addToMailingList(
    address: string,
    source: string | null
  ): Promise<void> {
    const member = new MailingListMember();
    member.address = address.toLowerCase();
    member.source = source;

    await getRepository(MailingListMember).upsert(member, ['address']);
  }

  async sendPendingEmails(livemode: boolean): Promise<void> {
    const toSend = await getConnection().transaction(
      async (transactionalEntityManager) => {
        const toSend = await transactionalEntityManager
          .getRepository(CampaignSend)
          .createQueryBuilder('campaign_send')
          .setLock('pessimistic_write')
          .where('campaign_send.status = :status', {
            status: CampaignSendStatus.PENDING,
            livemode: livemode,
            sendAt: LessThan(new Date()),
          })
          .limit(BULK_SEND_LIMIT)
          .getMany();

        await transactionalEntityManager
          .getRepository(CampaignSend)
          .createQueryBuilder()
          .update()
          .set({ status: CampaignSendStatus.SENDING })
          .whereInIds(toSend.map((s) => s.id))
          .execute();

        return toSend;
      }
    );

    const templatedEmailData = toSend.map((send) => ({
      templateAlias: send.template,
      from: Senders.PERSONAL,
      streamType: EmailStreamType.BROADCAST,
      to: send.address,

      templateContext: {},
      metadata: { sendId: `${send.id}`, template: send.template },
    }));

    const results = await EmailService.sendBulkTemplateEmail(
      templatedEmailData,
      livemode
    );

    // update the status of each send
    for (const [index, result] of results.entries()) {
      const send = toSend[index];
      if (result.code === 0) {
        send.status = CampaignSendStatus.SENT;
      } else {
        send.status = CampaignSendStatus.FAILED;
      }
      send.result = result;
    }

    await getRepository(CampaignSend).save(toSend);
  }
}

export default new EmailCampaignService();
