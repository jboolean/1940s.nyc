import MerchProvider from '../../enum/MerchProvider';
import * as MerchOrderService from '../merch/MerchOrderService';
import * as WhccClient from './whccApi';
import whccSubmissionToFulfillmentState from './WhccToMerchOrderStatusMap';

// Re-reads a submission from WHCC with our API key and applies what it says.
export async function syncSubmission(submissionId: string): Promise<void> {
  const submission = await WhccClient.getSubmission(submissionId);

  await MerchOrderService.onPrinterStatusChanged(
    MerchProvider.WHCC,
    submissionId,
    whccSubmissionToFulfillmentState(submission)
  );

  // A shipment with no tracking URL sends no shipped email.
  const trackingUrl = (submission.orders ?? [])
    .flatMap((o) => o.shippingInfo ?? [])
    .map((s) => s.trackingUrl)
    .filter((url): url is string => !!url)
    .pop();
  if (trackingUrl) {
    await MerchOrderService.onShipmentSent(
      MerchProvider.WHCC,
      submissionId,
      trackingUrl
    );
  }
}

// The webhook route verifies the delivery's signature. Only its ConfirmationId is used, to find the
// submission again from WHCC with our API key; the state applied comes from that read.
export async function handleEvent(confirmationId: string): Promise<void> {
  const { submissions } = await WhccClient.listSubmissions({ confirmationId });
  if (!submissions.length) {
    console.warn('WHCC event for an order we do not know', confirmationId);
    return;
  }
  for (const { id } of submissions) {
    await syncSubmission(id);
  }
}
