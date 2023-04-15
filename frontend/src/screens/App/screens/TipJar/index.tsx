import Modal from 'components/Modal';
import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import CurrencyInput from 'shared/components/CurrencyInput';
import stylesheet from './TipJar.less';
import useTipJarStore from './TipJarStore';
import useAmountPresets from './useAmountPresets';

export { useTipJarStore };

export default function TipJar(): JSX.Element {
  const {
    amountDollars,
    isOpen,
    isSubmitting,
    errorMessage,
    setAmountDollars,
    handleRequestClose,
    handleSubmit,
  } = useTipJarStore();

  const amountPresets = useAmountPresets();

  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={handleRequestClose}>
      <h1>Will you chip in on web hosting costs?</h1>
      <p>
        This site is a labor of love, but it costs real money to host. If you
        enjoy my site, consider pitching in a few dollars to keep it online.{' '}
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
          onClick={handleSubmit}
          disabled={!amountDollars || isSubmitting}
        >
          Leave Tip
        </Button>
      </div>
      {errorMessage && <div>{errorMessage}</div>}
    </Modal>
  );
}
