import React from 'react';

import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import FourtiesModal from 'shared/components/Modal';
import TextInput from 'shared/components/TextInput';

import useCreditPurchaseModalStore from './stories/CreditPurchaseStore';

import stylesheet from './CreditPurchaseModal.less';
import { NumericFormat } from 'react-number-format';

const PRICE = 0.1;

// some hacky money formatting that goes against everything I stand for
// const formatPrice = (price: number): string => {
//   if (price % 1 === 0) return `$${price.toFixed(0)}`;
//   return `$${price.toFixed(2)}`;
// };

export default function CreditPurchaseModal(): JSX.Element {
  const emailAddress = useCreditPurchaseModalStore(
    (state) => state.emailAddress
  );
  const {
    close: onRequestClose,
    // emailAddress,
    errorMessage,
    handleCheckout: handleCheckout,
    isCheckingOut,
    isFollowMagicLinkMessageVisible,
    isLoginValidated,
    isOpen,
    onEmailAddressChange,
    onSubmitLogin,
    quantityOptions,
    selectedQuantity,
    setQuantity,
  } = useCreditPurchaseModalStore();

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="large"
      isCloseButtonVisible={true}
    >
      <div className={stylesheet.textContainer}>
        <div>
          <h1>It takes a dime to ride!</h1>

          <div>
            <p>
              The first three photos per day are free, but because I&rsquo;m
              using the best AI colorization model available it costs a few
              cents after that to keep exploring in color. Please purchase color
              tokens to continue.
            </p>

            <p className={stylesheet.finePrint}>
              A color token is used each time you click “Colorize” on a photo
              that has never been colorized before. If you or anyone else has
              colored this photo before, it&rsquo;s free.
              <br />
              Already purchased tokens? Your email address will be used to
              retrieve them.
            </p>
          </div>

          <div className={stylesheet.emailRow}>
            <Labeled
              labelText="Your email address"
              className={stylesheet.email}
              renderInput={({ id }) => (
                <TextInput
                  id={id}
                  type="text"
                  value={emailAddress}
                  onChange={({ target: { value } }) => {
                    onEmailAddressChange(value);
                  }}
                />
              )}
            />

            <Button
              buttonStyle="primary"
              onClick={onSubmitLogin}
              disabled={isLoginValidated || !emailAddress}
              className={stylesheet.submitButton}
            >
              Continue
            </Button>
          </div>

          {isFollowMagicLinkMessageVisible && (
            <p className={stylesheet.magicLinkMessage}>
              You already have an account. Please click the link emailed to{' '}
              <i>{emailAddress}</i> to log in.
            </p>
          )}
        </div>

        <div>
          <div className={stylesheet.quantityOptions}>
            {quantityOptions.map((quantity) => (
              <Button
                buttonStyle="secondary"
                key={quantity}
                onClick={() => setQuantity(quantity)}
                isActive={selectedQuantity === quantity}
                disabled={!isLoginValidated}
              >
                <NumericFormat
                  displayType="text"
                  prefix="$"
                  value={quantity * PRICE}
                />
                &mdash;{quantity} photos
              </Button>
            ))}
            {/*quantityOptions.map((quantity) => (
              <Labeled
                key={quantity}
                labelText={`${quantity} photos—${formatPrice(
                  quantity * PRICE
                )}`}
                renderInput={({ id }) => (
                  <input
                    id={id}
                    type="radio"
                    name="quantity"
                    value={quantity}
                    checked={selectedQuantity === quantity}
                    onChange={({ target: { value } }) => {
                      setQuantity(Number(value));
                    }}
                    disabled={!isLoginValidated}
                  />
                )}
              />
                  )) */}
          </div>
        </div>

        <p className={stylesheet.finePrint}>
          Write me at <a href="mailto:julian@1940s.nyc">julian@1940s.nyc</a> if
          you have questions.
        </p>

        <div>
          <Button
            buttonStyle="primary"
            onClick={() => handleCheckout()}
            disabled={!isLoginValidated || isCheckingOut}
          >
            Continue to Checkout
          </Button>
          {errorMessage && <div>{errorMessage}</div>}
        </div>
      </div>
    </FourtiesModal>
  );
}

export function openCreditPurchaseModal(): void {
  useCreditPurchaseModalStore.getState().open();
}

// For testing
if (__DEV__) openCreditPurchaseModal();
