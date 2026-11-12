import express from 'express';
import { isSignedByWhcc } from '../business/whcc/isSignedByWhcc';
import * as WhccCallbackService from '../business/whcc/WhccCallbackService';

const router = express.Router();

// The event is signed, but only its ConfirmationId is used: it finds the submission again from WHCC
// with our API key, and the state applied comes from that read.
router.post('/', async (req, res) => {
  const rawBody = req.body as Buffer;
  let signed: boolean;
  try {
    signed =
      Buffer.isBuffer(rawBody) &&
      isSignedByWhcc(req.header('WHCC-Signature'), rawBody);
  } catch (e) {
    // The signing secret is missing, so WHCC should retry once it is set.
    console.error('[WHCC webhook] Cannot check the signature', e);
    res.status(503).send();
    return;
  }
  if (!signed) {
    // A 4xx is terminal for WHCC, which is right for a delivery that did not come from it.
    console.error('[WHCC webhook] Rejecting a delivery with a bad signature');
    res.status(401).send();
    return;
  }
  let confirmationId: unknown;
  try {
    confirmationId = (
      JSON.parse(rawBody.toString('utf8')) as {
        ConfirmationId?: unknown;
      }
    ).ConfirmationId;
  } catch {
    confirmationId = undefined;
  }
  if (typeof confirmationId !== 'string') {
    console.error('[WHCC webhook] Ignoring an event we cannot parse');
    res.status(400).send();
    return;
  }
  try {
    await WhccCallbackService.handleEvent(confirmationId);
    res.status(200).send();
  } catch (e) {
    console.error('[WHCC webhook] Failed to process event', e);
    res.status(503).send();
  }
});

export default router;
