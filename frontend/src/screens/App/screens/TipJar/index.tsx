import classnames from 'classnames';
import Modal from 'components/Modal';
import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import CurrencyInput from 'shared/components/CurrencyInput';
import TextButton from 'shared/components/TextButton';
import useLoginStore from 'shared/stores/LoginStore';
import useElementId from 'shared/utils/useElementId';
import TotBagImage from './assets/tote-bag-small-back.png';
import LoginToManageModal from './LoginToManageModal';
import stylesheet from './TipJar.less';
import useTipJarStore from './TipJarStore';
import useAmountPresets from './useAmountPresets';
import Gift from './utils/Gift';
import TipFrequency from './utils/TipFrequency';

export { useTipJarStore };

const COPY_BY_VARIANT = {
  default: {
    title: 'Will you chip in on web hosting costs?',
    body: (
      <p>
        This site is a labor of love, but processing and hosting 3.7TB of photos
        costs real money. If you enjoy my site, consider pitching in a few
        dollars, or become a sustaining supporter to keep it going.
      </p>
    ),
  },
  colorization: {
    title: 'Enjoying these color photos?',
    body: (
      <>
        <p>
          Colorization on <i>1940s.nyc</i> uses the best machine learning model
          available. Every photo costs money to process.
        </p>
        <p>
          <strong>
            Would you please chip in a few bucks to cover these costs?
          </strong>{' '}
          <br />I can only continue to offer this feature with your support.
        </p>
      </>
    ),
  },
};

function GiftOption({
  title,
  value,
  minimum,
  frequency,
  description,
  imageSrc,
}: {
  title: React.ReactNode;
  value: Gift['gift'];
  minimum: number;
  frequency: TipFrequency;
  description: React.ReactNode;
  imageSrc: string;
}): JSX.Element {
  const { selectedGift, setSelectedGift } = useTipJarStore();
  const id = useElementId('gift-option');
  const minimumDollars = minimum / 100;
  return (
    <label className={classnames(stylesheet.giftOption)} htmlFor={id}>
      <input
        type="radio"
        id={id}
        name="gift"
        value={value}
        checked={selectedGift === value}
        onChange={() => setSelectedGift(value)}
        className={stylesheet.giftInput}
      />
      <img
        src={imageSrc}
        alt="Product image"
        className={stylesheet.giftImage}
      />
      <div className={stylesheet.giftCopy}>
        <div className={stylesheet.giftName}>{title}</div>
        <div className={stylesheet.giftMinimum}>
          <NumericFormat
            displayType="text"
            prefix="$"
            value={minimumDollars}
            decimalScale={minimumDollars % 1 === 0 ? 0 : 2}
            fixedDecimalScale
          />
          {frequency === TipFrequency.MONTHLY ? ' / month' : ''} or more
        </div>
        <div className={stylesheet.giftDescription}>{description}</div>
      </div>
    </label>
  );
}

const renderGift = ({
  gift,
  frequency,
  minimumAmount,
}: Gift): JSX.Element | null => {
  switch (gift) {
    case 'tote-bag':
      return (
        <GiftOption
          key={gift}
          title={
            <>
              Custom <i>1940s.nyc</i> tote
            </>
          }
          value={gift}
          minimum={minimumAmount}
          frequency={frequency}
          description={
            <>
              This custom-made bag features &ldquo;1940s.nyc&rdquo; on the front
              in one of six color options, and a map of any NYC area of your
              choice on the back. You&rsquo;ll get an email to select the area
              and colors.
            </>
          }
          imageSrc={TotBagImage}
        />
      );
  }
};

export default function TipJar(): JSX.Element {
  const {
    amountDollars,
    frequency,
    isOpen,
    isSubmitting,
    errorMessage,
    setAmountDollars,
    setFrequency,
    handleRequestClose,
    handleSubmit,
    variant,
    allGifts,
    selectedGift,
    setSelectedGift,
    openLogin,
  } = useTipJarStore();

  const {
    initialize: initializeLoginStore,
    emailAddress,
    logout,
  } = useLoginStore();

  React.useEffect(() => {
    initializeLoginStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountPresets = useAmountPresets(frequency);

  const { title, body } = COPY_BY_VARIANT[variant];

  const applicableGifts = allGifts.filter(
    (gift) => gift.frequency === frequency
  );

  return (
    <Modal size="x-large" isOpen={isOpen} onRequestClose={handleRequestClose}>
      <LoginToManageModal />
      <div className={stylesheet.content}>
        <div className={stylesheet.introCopy}>
          <h1>{title}</h1>
          {body}{' '}
          <p>
            Thank you, <br />
            <em>– Julian</em>
          </p>
          <a
            href="https://paypal.me/julianboilen"
            target="_blank"
            rel="noopener noreferrer"
          >
            I’m also on <i>PayPal</i>.
          </a>
          <p>
            <TextButton onClick={openLogin}>
              Manage recurring support or update payment information in the{' '}
              <i>Supporter Dashboard</i> →
            </TextButton>
          </p>
          <p>1940s.nyc is not associated with the NYC Department of Records.</p>
        </div>
        <div className={stylesheet.donationForm}>
          <div className={stylesheet.buttonRow}>
            {[
              [TipFrequency.MONTHLY, 'Monthly support'],
              [TipFrequency.ONCE, 'One-time tip'],
            ].map(([v, label]: [TipFrequency, string]) => (
              <Button
                buttonStyle="secondary"
                key={v}
                onClick={() => setFrequency(v)}
                isActive={v === frequency}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className={classnames(stylesheet.presets, stylesheet.buttonRow)}>
            {amountPresets.map((presetAmount) => (
              <Button
                buttonStyle="secondary"
                disabled={!frequency}
                key={presetAmount}
                onClick={() => setAmountDollars(presetAmount)}
                isActive={presetAmount === amountDollars}
              >
                <NumericFormat
                  displayType="text"
                  prefix="$"
                  value={presetAmount}
                  decimalScale={presetAmount % 1 === 0 ? 0 : 2}
                  fixedDecimalScale
                />
              </Button>
            ))}
          </div>
          {applicableGifts.length ? (
            <div>
              <div className={stylesheet.giftsHeading}>
                Choose a thank-you gift
              </div>
              <div className={stylesheet.finePrint}>Shipping will be added</div>
              <div className={stylesheet.gifts}>
                <label
                  className={classnames(
                    stylesheet.giftOption,
                    stylesheet.noGiftOption
                  )}
                >
                  <input
                    type="radio"
                    name="gift"
                    value={'none'}
                    checked={!selectedGift}
                    onChange={() => setSelectedGift(null)}
                    className={stylesheet.giftInput}
                  />

                  <div className={stylesheet.giftCopy}>
                    <div className={stylesheet.giftName}>No gift for me</div>
                  </div>
                </label>
                {applicableGifts.map(renderGift)}
              </div>
            </div>
          ) : null}
          {emailAddress ? (
            <p>
              You are logged in as <i>{emailAddress}</i>.{' '}
              <TextButton onClick={logout}>Not me, log out</TextButton>
            </p>
          ) : null}
          <div className={stylesheet.tipForm}>
            <CurrencyInput
              value={amountDollars}
              allowNegative={false}
              placeholder="$0"
              fixedDecimalScale={amountDollars % 1 !== 0}
              onValueChange={({ floatValue }) => {
                setAmountDollars(floatValue);
              }}
              disabled={!frequency}
              className={stylesheet.amountInput}
            />
            <Button
              buttonStyle="primary"
              onClick={handleSubmit}
              disabled={!amountDollars || isSubmitting}
            >
              {frequency === TipFrequency.ONCE
                ? 'Leave Tip'
                : 'Support Monthly'}{' '}
              →
            </Button>
          </div>
          {errorMessage && <div>{errorMessage}</div>}
        </div>
      </div>
    </Modal>
  );
}
