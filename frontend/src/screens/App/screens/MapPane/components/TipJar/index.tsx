import React from 'react';
import Modal from 'components/Modal';
import redirectToCheckout from './redirectToCheckout';
import NumberFormat from 'react-number-format';

import stylesheet from './TipJar.less';

const DEFAULT_AMOUNT = 2;

export default function TipJar({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const [amountDollars, setAmountDollars] = React.useState(DEFAULT_AMOUNT);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<null | string>(null);

  const handleSubmitClick = async (): Promise<void> => {
    if (Number.isNaN(amountDollars) || amountDollars <= 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Input is dollars, convert to cents
      await redirectToCheckout(amountDollars * 100);
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={onRequestClose}>
      <h1>Will you chip in on web hosting costs?</h1>
      <p>
        It costs money to keep this site online, especially given the surprising
        amount of traffic it’s received.
      </p>
      <p>If tips cover web hosting costs, I’ll remove the tip jar.</p>
      <p>
        Thanks, <br />
        <em>– Julian</em>
      </p>
      <div className={stylesheet.tipForm}>
        <NumberFormat
          value={amountDollars}
          decimalScale={2}
          prefix="$"
          thousandSeparator
          allowNegative={false}
          className={stylesheet.amountInput}
          onValueChange={({ floatValue }) => {
            setAmountDollars(floatValue);
          }}
        />
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={!amountDollars || isSubmitting}
          className={stylesheet.submitButton}
        >
          Leave Tip
        </button>
        {errorMessage && <div>{errorMessage}</div>}
      </div>
    </Modal>
  );
}
