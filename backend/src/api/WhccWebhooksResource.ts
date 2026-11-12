import express from 'express';
import required from '../business/utils/required';
import * as WhccCallbackService from '../business/whcc/WhccCallbackService';
import stripe from '../third-party/stripe';

const router = express.Router();

const SIGNATURE_TOLERANCE_SECONDS = 300;

// The event is signed, but only its ConfirmationId is used: it finds the submission again from WHCC
// with our API key, and the state applied comes from that read.
router.post('/', async (req, res) => {
  const rawBody = req.body as Buffer;
  let secret: string;
  try {
    secret = required(process.env.WHCC_SIGNING_SECRET, 'WHCC_SIGNING_SECRET');
  } catch (e) {
    // The signing secret is missing, so WHCC should retry once it is set.
    console.error('[WHCC webhook] Cannot check the signature', e);
    res.status(503).send();
    return;
  }
  try {
    // WHCC signs like Stripe: WHCC-Signature is t=<seconds>,v1=<HMAC-SHA256 of "<t>.<raw body>">,
    // in uppercase hex, which the verifier compares against lowercase.
    stripe.webhooks.signature.verifyHeader(
      rawBody.toString('utf8'),
      (req.header('WHCC-Signature') ?? '').toLowerCase(),
      secret,
      SIGNATURE_TOLERANCE_SECONDS
    );
  } catch {
    // A 4xx is terminal for WHCC, which is right for a delivery that did not come from it.
    console.error('[WHCC webhook] Rejecting a delivery with a bad signature');
    res.status(401).send();
    return;
  }
  let event: {
    ConfirmationId?: unknown;
    EventType?: string;
    SequenceNumber?: string;
  };
  try {
    event = JSON.parse(rawBody.toString('utf8')) as typeof event;
  } catch {
    event = {};
  }
  if (typeof event.ConfirmationId !== 'string') {
    console.error('[WHCC webhook] Ignoring an event we cannot parse');
    res.status(400).send();
    return;
  }
  try {
    await WhccCallbackService.handleEvent({
      eventType: event.EventType ?? '',
      confirmationId: event.ConfirmationId,
      sequenceNumber: event.SequenceNumber ?? '',
    });
    res.status(200).send();
  } catch (e) {
    console.error('[WHCC webhook] Failed to process event', e);
    res.status(503).send();
  }
});

export default router;
