import EmailService from '../business/email/EmailService';
import ReviewQueueStaleTemplate from '../business/email/templates/MerchOrdersQueueTemplate';
import {
  getOrdersForReview,
  getOrdersWithExceptions,
} from '../business/merch/MerchOrderService';

function forgeReviewMerchUrl(): string {
  const reviewMerchUrl: URL = new URL(
    `/admin/review-merch`,
    process.env.FRONTEND_BASE_URL
  );

  return reviewMerchUrl.toString();
}

export default async function checkMerchQueue(): Promise<void> {
  const [ordersForReview, ordersWithExceptions] = await Promise.all([
    getOrdersForReview(),
    getOrdersWithExceptions(),
  ]);

  if (ordersForReview.length === 0 && ordersWithExceptions.length === 0) {
    console.log('No orders found');
    return;
  }

  const email = ReviewQueueStaleTemplate.createTemplatedEmail({
    templateContext: {
      orders: ordersForReview.length ? { count: ordersForReview.length } : null,
      exceptions: ordersWithExceptions.length
        ? { count: ordersWithExceptions.length }
        : null,
      reviewMerchUrl: forgeReviewMerchUrl(),
    },
    metadata: {},
    to: process.env.MERCH_REVIEWER_EMAILS ?? '',
  });

  await EmailService.sendTemplateEmail(email);
}
