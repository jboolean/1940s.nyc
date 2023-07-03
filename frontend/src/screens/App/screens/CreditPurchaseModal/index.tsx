import React from 'react';

import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import FourtiesModal from 'shared/components/Modal';
import TextInput from 'shared/components/TextInput';

import useCreditPurchaseModalStore from './stories/CreditPurchaseStore';

const PRICE = 0.1;

// some hacky money formatting that goes against everything I stand for
const formatPrice = (price: number): string => {
  if (price % 1) return `$${price.toFixed(0)}`;
  return `$${price.toFixed(2)}`;
};

export default function CreditPurchaseModal(): JSX.Element {
  const {
    close: onRequestClose,
    emailAddress,
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
      <div>
        <h1>It takes a dime to ride!</h1>

        <div>
          <p>
            The first three photos per day are free, but because I&rsquo;m using
            the best AI colorization model available it costs a few cents after
            that to keep exploring in color. Please purchase color tokens to
            continue.
          </p>

          <p>
            A color token is used each time you click “Colorize” on a photo that
            has never been colorized before. If you or anyone else has colored
            this photo, it&rsquo;s free.
          </p>

          <p>
            Already purchased tokens? Your email address will be used to
            retrieve them.
          </p>

          <p>
            Write me at <a href="mailto:julian@1940s.nyc">julian@1940s.nyc</a>{' '}
            if you have questions.
          </p>
        </div>

        <div>
          <Labeled
            labelText="Email"
            renderInput={({ id }) => (
              <TextInput
                id={id}
                type="text"
                value={emailAddress}
                onChange={({ target: { value } }) => {
                  onEmailAddressChange(value);
                }}
                disabled={isLoginValidated}
              />
            )}
          />
        </div>

        <Button
          buttonStyle="primary"
          onClick={onSubmitLogin}
          disabled={isLoginValidated || !emailAddress}
        >
          Continue
        </Button>

        {isFollowMagicLinkMessageVisible && (
          <p>
            You already have an account. Please click the link emailed to{' '}
            <i>{emailAddress}</i> to log in.
          </p>
        )}
      </div>

      <div>
        <div>
          {quantityOptions.map((quantity) => (
            <Labeled
              key={quantity}
              labelText={`${quantity} photos - ${formatPrice(
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
          ))}
        </div>
      </div>

      <div>
        <Button
          buttonStyle="primary"
          onClick={() => handleCheckout()}
          disabled={!isLoginValidated || isCheckingOut}
        >
          Continue to Payment
        </Button>
        {errorMessage && <div>{errorMessage}</div>}
      </div>
    </FourtiesModal>
  );
}

export function openCreditPurchaseModal(): void {
  useCreditPurchaseModalStore.getState().open();
}
