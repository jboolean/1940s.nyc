import classnames from 'classnames';
import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import TextButton from 'shared/components/TextButton';
import TextInput from 'shared/components/TextInput';
import useLoginStore from 'shared/stores/LoginStore';
import { MerchInternalVariant } from 'shared/utils/merch/Order';

import TotBagImageBack from './assets/tote-bag-small-back.png';
import TotBagImageDefault from './assets/tote-bag-small-default.png';
import useMerchCheckoutStore, {
  useMerchCheckoutStoreComputeds,
} from './stores/MerchCheckoutStore';

import FourtiesModal from 'shared/components/Modal';
import stylesheet from './MerchModal.less';

interface ProductOptionProps {
  title: React.ReactNode;
  variant: MerchInternalVariant;
  priceAmount: number;
  description: React.ReactNode;
  imageSrcBack?: string;
  imageSrcDefault: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

function ProductOption({
  title,
  priceAmount,
  description,
  imageSrcBack,
  imageSrcDefault,
  quantity,
  onQuantityChange,
}: ProductOptionProps): JSX.Element {
  const priceDollars = priceAmount / 100;
  const [isHovered, setIsHovered] = React.useState(false);
  const imageSrc = isHovered
    ? imageSrcDefault
    : imageSrcBack ?? imageSrcDefault;

  return (
    <div className={classnames(stylesheet.productOption)}>
      <TextInput
        type="number"
        min="0"
        step="1"
        value={quantity}
        onChange={(e) => {
          const value = e.target.value;
          if (value === '') {
            onQuantityChange(0);
          } else {
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed) && parsed >= 0) {
              onQuantityChange(parsed);
            }
          }
        }}
        className={stylesheet.quantityInput}
      />
      <img
        src={imageSrc}
        alt="Product image"
        className={stylesheet.productImage}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      />
      <div className={stylesheet.productCopy}>
        <div className={stylesheet.productName}>{title}</div>
        <div className={stylesheet.productPrice}>
          <NumericFormat
            displayType="text"
            prefix="$"
            value={priceDollars}
            decimalScale={priceDollars % 1 === 0 ? 0 : 2}
            fixedDecimalScale
          />
        </div>
        <div className={stylesheet.productDescription}>{description}</div>
      </div>
    </div>
  );
}

const renderProduct = (
  product: { variant: MerchInternalVariant; priceAmount: number },
  quantity: number,
  onQuantityChange: (quantity: number) => void
): JSX.Element | null => {
  switch (product.variant) {
    case MerchInternalVariant.TOTE_BAG_SMALL:
      return (
        <ProductOption
          key={product.variant}
          title={
            <>
              Custom <i>1940s.nyc</i> tote
            </>
          }
          variant={product.variant}
          priceAmount={product.priceAmount}
          description={
            <>
              This custom-made bag features &ldquo;1940s.nyc&rdquo; on the front
              in one of six color options, and a map of any NYC area of your
              choice on the back. You&rsquo;ll get an email to select the area
              and colors.
            </>
          }
          imageSrcBack={TotBagImageBack}
          imageSrcDefault={TotBagImageDefault}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
        />
      );
    default:
      return null;
  }
};

export default function MerchModal(): JSX.Element {
  const {
    close: onRequestClose,
    errorMessage,
    handleCheckout,
    isOpen,
    availableProducts,
    productQuantities,
    setQuantity,
  } = useMerchCheckoutStore();

  const { isCheckoutDisabled } = useMerchCheckoutStoreComputeds();

  const {
    initialize: initializeLoginStore,
    emailAddress,
    logout,
  } = useLoginStore();

  React.useEffect(() => {
    initializeLoginStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="large"
      isCloseButtonVisible={true}
      className={stylesheet.merchModal}
    >
      <div className={stylesheet.content}>
        <h1>Shop merch</h1>
        <div className={stylesheet.productsArea}>
          {availableProducts && availableProducts.length > 0 && (
            <>
              <div className={stylesheet.products}>
                {availableProducts.map((product) =>
                  renderProduct(
                    product,
                    productQuantities[product.variant],
                    (quantity) => setQuantity(product.variant, quantity)
                  )
                )}
              </div>
              <div className={stylesheet.finePrint}>Shipping will be added</div>
            </>
          )}

          {emailAddress ? (
            <p>
              You are logged in as <i>{emailAddress}</i>.{' '}
              <TextButton onClick={logout}>Not me, log out</TextButton>
            </p>
          ) : null}
        </div>

        <div className={stylesheet.buttonRow}>
          <Button
            buttonStyle="primary"
            onClick={() => handleCheckout()}
            disabled={isCheckoutDisabled}
          >
            Continue to Checkout
          </Button>
          {errorMessage && <div>{errorMessage}</div>}
        </div>
      </div>
    </FourtiesModal>
  );
}

export function openMerchModal(): void {
  useMerchCheckoutStore.getState().open();
}
