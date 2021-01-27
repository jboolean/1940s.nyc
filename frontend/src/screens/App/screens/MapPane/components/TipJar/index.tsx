import React from 'react';
import Modal from 'components/Modal';
import redirectToCheckout from './redirectToCheckout';
import NumberFormat from 'react-number-format';
import classnames from 'classnames';

import stylesheet from './TipJar.less';
import recordEvent from 'shared/utils/recordEvent';
import useAmountPresets from './useAmountPresets';

export default function TipJar({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const [amountDollars, setAmountDollars] = React.useState<
    undefined | number
  >();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<null | string>(null);

  const amountPresets = useAmountPresets();

  const handleSubmitClick = async (): Promise<void> => {
    if (Number.isNaN(amountDollars) || amountDollars <= 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    recordEvent({
      category: 'Tip Jar',
      action: 'Click Checkout',
      value: amountDollars * 100,
    });
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
        I’ve received a surprisingly large amount of traffic on this site
        recently. It costs money to serve up photos and maps. If you enjoy my
        site, consider pitching in a few dollars to keep it online.{' '}
        <a
          href="https://paypal.me/julianboilen"
          target="_blank"
          rel="noopener noreferrer"
        >
          I’m also on PayPal.
        </a>
      </p>
      <p>
        Thank you, <br />
        <em>– Julian</em>
      </p>
      <div className={stylesheet.presets}>
        {amountPresets.map((presetAmount) => (
          <button
            key={presetAmount}
            type="button"
            onClick={() => setAmountDollars(presetAmount)}
            className={classnames(stylesheet.preset, {
              [stylesheet.active]: presetAmount === amountDollars,
            })}
          >
            <NumberFormat displayType="text" prefix="$" value={presetAmount} />
          </button>
        ))}
      </div>
      <div className={stylesheet.tipForm}>
        <NumberFormat
          value={amountDollars}
          placeholder="$0"
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
      </div>
      {errorMessage && <div>{errorMessage}</div>}
    </Modal>
  );
}
