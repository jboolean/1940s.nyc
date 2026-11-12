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
export async function handleEvent(event: {
  eventType: string;
  confirmationId: string;
  sequenceNumber: string;
}): Promise<void> {
  const { submissions } = await WhccClient.listSubmissions({
    confirmationId: event.confirmationId,
  });
  console.log(
    `WHCC event ${event.eventType} ${event.confirmationId} ${event.sequenceNumber} ->`,
    submissions.length
      ? submissions.map((s) => s.reference ?? s.id).join(', ')
      : 'no matching order'
  );
  if (!submissions.length) {
    console.warn(
      'WHCC event for an order we do not know',
      event.confirmationId
    );
    return;
  }
  for (const { id } of submissions) {
    await syncSubmission(id);
  }
}
