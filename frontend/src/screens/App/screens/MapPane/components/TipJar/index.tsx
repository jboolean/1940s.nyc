import Modal from 'components/Modal';
import React from 'react';
import { NumericFormat } from 'react-number-format';
import redirectToCheckout from './redirectToCheckout';

import Button from 'shared/components/Button';
import recordEvent from 'shared/utils/recordEvent';
import stylesheet from './TipJar.less';
import useAmountPresets from './useAmountPresets';
import CurrencyInput from 'shared/components/CurrencyInput';

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      setErrorMessage(error?.message || 'Something went wrong');
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
          <Button
            buttonStyle="secondary"
            key={presetAmount}
            onClick={() => setAmountDollars(presetAmount)}
            isActive={presetAmount === amountDollars}
          >
            <NumericFormat displayType="text" prefix="$" value={presetAmount} />
          </Button>
        ))}
      </div>
      <div className={stylesheet.tipForm}>
        <CurrencyInput
          value={amountDollars}
          allowNegative={false}
          placeholder="$0"
          onValueChange={({ floatValue }) => {
            setAmountDollars(floatValue);
          }}
          className={stylesheet.amountInput}
        />
        <Button
          buttonStyle="primary"
          onClick={handleSubmitClick}
          disabled={!amountDollars || isSubmitting}
        >
          Leave Tip
        </Button>
      </div>
      {errorMessage && <div>{errorMessage}</div>}
    </Modal>
  );
}
