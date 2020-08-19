import React from 'react';
import Modal from 'components/Modal';
import redirectToCheckout from './redirectToCheckout';
import NumberFormat from 'react-number-format';
import classnames from 'classnames';

import stylesheet from './TipJar.less';

const PRESET_OPTIONS = [2, 4, 8, 16];

export default function TipJar({
  isOpen,
  onRequestClose,
}: Pick<ReactModal.Props, 'isOpen' | 'onRequestClose'>): JSX.Element {
  const [amountDollars, setAmountDollars] = React.useState<
    undefined | number
  >();
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
      <p>
        Thank you, <br />
        <em>– Julian</em>
      </p>
      <div className={stylesheet.presets}>
        {PRESET_OPTIONS.map(presetAmount => (
          <button
            key={presetAmount}
            type="button"
            onClick={() => setAmountDollars(presetAmount)}
            className={classnames(stylesheet.preset, {
              [stylesheet.active]: presetAmount === amountDollars,
            })}
          >
            <NumberFormat
              displayType="text"
              prefix="$"
              thousandsSeparator
              value={presetAmount}
            />
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
