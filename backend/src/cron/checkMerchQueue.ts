import EmailService from '../business/email/EmailService';
import ReviewQueueStaleTemplate from '../business/email/templates/MerchOrdersQueueTemplate';
import { getOrdersForReview } from '../business/merch/MerchOrderService';

function forgeReviewMerchUrl(): string {
  const reviewMerchUrl: URL = new URL(
    `/admin/review-merch`,
    process.env.FRONTEND_BASE_URL
  );

  return reviewMerchUrl.toString();
}

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
      reviewMerchUrl: forgeReviewMerchUrl(),
    },
    metadata: {},
    to: process.env.MERCH_REVIEWER_EMAILS ?? '',
  });

  await EmailService.sendTemplateEmail(email);
}
