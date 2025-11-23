import React from 'react';

import Button from 'shared/components/Button';
import TextButton from 'shared/components/TextButton';
import useLoginStore from 'shared/stores/LoginStore';

import Product from './components/Product';
import useMerchCheckoutStore, {
  useMerchCheckoutStoreComputeds,
} from './stores/MerchCheckoutStore';

import FourtiesModal from 'shared/components/Modal';
import stylesheet from './MerchModal.less';

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
                {availableProducts.map((product) => (
                  <Product
                    key={product.variant}
                    product={product}
                    quantity={productQuantities[product.variant]}
                    onQuantityChange={(quantity) =>
                      setQuantity(product.variant, quantity)
                    }
                  />
                ))}
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
