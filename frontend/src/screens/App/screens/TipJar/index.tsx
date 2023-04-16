import Modal from 'components/Modal';
import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import CurrencyInput from 'shared/components/CurrencyInput';
import stylesheet from './TipJar.less';
import useTipJarStore from './TipJarStore';
import useAmountPresets from './useAmountPresets';

export { useTipJarStore };

const COPY_BY_VARIANT = {
  default: {
    title: 'Will you chip in on web hosting costs?',
    body: (
      <p>
        This site is a labor of love, but it costs real money to host. If you
        enjoy my site, consider pitching in a few dollars to keep it online.
      </p>
    ),
  },
  colorization: {
    title: 'Enjoying these color photos?',
    body: (
      <>
        <p>
          Colorization on <i>1940s.nyc</i> uses the best colorization machine
          learning model available. It costs a bit to process each photo, which
          adds up.{' '}
        </p>

        <p>
          <strong>
            Would you please chip in a few bucks to cover my costs?
          </strong>{' '}
          <br />I can only continue to offer this feature for free with your
          support.
        </p>
      </>
    ),
  },
};

export default function TipJar(): JSX.Element {
  const {
    amountDollars,
    isOpen,
    isSubmitting,
    errorMessage,
    setAmountDollars,
    handleRequestClose,
    handleSubmit,
    variant,
  } = useTipJarStore();

  const amountPresets = useAmountPresets();

  const { title, body } = COPY_BY_VARIANT[variant];

  return (
    <Modal size="small" isOpen={isOpen} onRequestClose={handleRequestClose}>
      <h1>{title}</h1>
      {body}{' '}
      <a
        href="https://paypal.me/julianboilen"
        target="_blank"
        rel="noopener noreferrer"
      >
        I’m also on PayPal.
      </a>
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
