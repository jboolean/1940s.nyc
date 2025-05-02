import EmailService from '../business/email/EmailService';
import ReviewQueueStaleTemplate from '../business/email/templates/MerchOrdersQueueTemplate';
import { getOrdersForReview } from '../business/merch/MerchOrderService';

export default async function checkMerchQueue(): Promise<void> {
  const ordersForReview = await getOrdersForReview();

  if (ordersForReview.length === 0) {
    console.log('No orders found');
    return;
  }

  const ordersCount = ordersForReview.length;

  const email = ReviewQueueStaleTemplate.createTemplatedEmail({
    templateContext: {
      ordersCount,
    },
    metadata: {},
    to: process.env.MERCH_REVIEWER_EMAILS ?? '',
  });

  await EmailService.sendTemplateEmail(email);
}
