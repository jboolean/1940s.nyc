import React from 'react';

import classNames from 'classnames';
import Button from 'shared/components/Button';
import Labeled from 'shared/components/Labeled';
import TextInput from 'shared/components/TextInput';

import useCreditPurchaseModalStore from './stories/CreditPurchaseStore';

import { NumericFormat } from 'react-number-format';
import PhotoAsideModal from '../PhotoAsideModal';
import carouselImages from './carouselImages';

import stylesheet from './CreditPurchaseModal.less';

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
    unitPrice,
  } = useCreditPurchaseModalStore();

  return (
    <PhotoAsideModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="x-large"
      isCloseButtonVisible={true}
      className={stylesheet.creditPurchaseModal}
      carouselProps={{
        images: carouselImages,
        className: stylesheet.image,
      }}
    >
      <div>
        <h1>Ride for just a dime!</h1>

        <div>
          <p>
            Enjoy three free colorized photos per day using the best AI
            colorization model available. After that, a small fee is required to
            cover the costs of the model. Purchase tokens to keep exploring in
            color.
          </p>

          <p className={stylesheet.finePrint}>
            A color token is consumed each time you click <i>Colorize</i> on a
            photo that hasn&rsquo;t been colorized before. If the photo has been
            colored by you or someone else, it&rsquo;s free.
            <br />
            Already bought tokens? Your email address will be used to retrieve
            them.
          </p>
        </div>

        <form
          className={stylesheet.emailRow}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitLogin();
          }}
        >
          <Labeled
            labelText="Your email address"
            className={stylesheet.email}
            renderInput={({ id }) => (
              <TextInput
                id={id}
                type="email"
                value={emailAddress}
                autoComplete="email"
                required
                onChange={({ target: { value } }) => {
                  onEmailAddressChange(value);
                }}
                disabled={isLoginValidated}
              />
            )}
          />

          <Button
            type="submit"
            buttonStyle="primary"
            disabled={isLoginValidated || !emailAddress}
            className={stylesheet.submitButton}
          >
            Continue
          </Button>
        </form>

        {isFollowMagicLinkMessageVisible && (
          <p className={stylesheet.magicLinkMessage}>
            You already have an account. Please click the link emailed to{' '}
            <i>{emailAddress}</i> to log in.
          </p>
        )}
      </div>

      <div>
        <div
          className={classNames(stylesheet.quantityOptions, {
            [stylesheet.disabled]: !isLoginValidated,
          })}
        >
          {unitPrice !== null &&
            quantityOptions.map((quantity) => (
              <Button
                buttonStyle="secondary"
                key={quantity}
                onClick={() => setQuantity(quantity)}
                isActive={selectedQuantity === quantity && isLoginValidated}
                disabled={!isLoginValidated}
              >
                <NumericFormat
                  displayType="text"
                  prefix="$"
                  value={quantity * (unitPrice / 100)}
                />
                &mdash;{quantity} photos
              </Button>
            ))}
        </div>
      </div>

      <p className={stylesheet.finePrint}>
        Write me at{' '}
        <a href="mailto:julian@1940s.nyc" target="_blank  " rel="noreferrer">
          julian@1940s.nyc
        </a>{' '}
        if you have questions. Color by{' '}
        <a
          href="http://palette.fm?utm_source=fourtiesnyc"
          target="_blank"
          rel="noreferrer"
        >
          Palette
        </a>
        .
      </p>

      <div className={stylesheet.buttonRow}>
        <Button
          buttonStyle={isLoginValidated ? 'primary' : 'secondary'}
          onClick={() => handleCheckout()}
          disabled={!isLoginValidated || isCheckingOut}
        >
          Continue to Checkout
        </Button>
        {errorMessage && <div>{errorMessage}</div>}
      </div>
    </PhotoAsideModal>
  );
}

export function openCreditPurchaseModal(): void {
  useCreditPurchaseModalStore.getState().open();
}

openCreditPurchaseModal();

export { default as CreditPurchaseSuccessMessage } from './SuccessMessage';
