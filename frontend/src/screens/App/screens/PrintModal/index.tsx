import React from 'react';

import FourtiesModal from 'shared/components/Modal';
import ArchivesCard from './components/ArchivesCard';
import OrderSummary from './components/OrderSummary';
import PhotoPreview from './components/PhotoPreview';
import PrintOptions from './components/PrintOptions';
import ProductPicker from './components/ProductPicker';
import stylesheet from './PrintModal.less';
import usePrintCheckoutStore from './stores/PrintCheckoutStore';
import { isValidQuantity, parseQuantity } from './utils/quantity';

export default function PrintModal(): React.JSX.Element {
  const {
    isOpen,
    close,
    photoIdentifier,
    photo,
    products,
    variant,
    colorize,
    errorMessage,
    isLoading,
    isCheckingOut,
    isOrderPlaced,
    setVariant,
    setQuantity,
    setColorize,
    addToCart,
    checkout,
  } = usePrintCheckoutStore();

  const [quantityText, setQuantityText] = React.useState('1');
  const parsedQuantity = parseQuantity(quantityText);
  const isQuantityValid = isValidQuantity(parsedQuantity);

  React.useEffect(() => {
    if (isOpen) setQuantityText('1');
  }, [isOpen, photo?.identifier]);

  // Coming back from Stripe with the back button can restore the page as it was left.
  React.useEffect(() => {
    const onPageShow = (e: PageTransitionEvent): void => {
      if (e.persisted) close();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [close]);

  const selected = products.find((p) => p.variant === variant);
  const total =
    selected && isQuantityValid ? selected.priceAmount * parsedQuantity : 0;
  const canOrder = photo?.collection === '1940' && products.length > 0;

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={close}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="large"
      // Without a form the modal has nothing to fill a fixed height with.
      isContentSized={!canOrder}
      className={stylesheet.printModal}
    >
      <div className={stylesheet.content} data-testid="print-modal">
        {isOrderPlaced ? (
          <>
            <h1>Order placed</h1>
            <p data-testid="print-order-placed">
              Thank you! A confirmation email is on its way.
            </p>
          </>
        ) : (
          <>
            <h1>Order a print</h1>
            {isLoading && <div className={stylesheet.loading}>Loading…</div>}
            {errorMessage && (
              <div className={stylesheet.error} data-testid="print-error">
                {errorMessage}
              </div>
            )}

            {photo && canOrder && (
              <div className={stylesheet.form}>
                <PhotoPreview
                  photoIdentifier={photo.identifier}
                  frame={selected?.frame}
                  className={stylesheet.thumbnail}
                />
                <div className={stylesheet.fields}>
                  <ProductPicker
                    products={products}
                    variant={variant}
                    onChange={setVariant}
                  />
                  <PrintOptions
                    colorize={colorize}
                    onColorizeChange={setColorize}
                    quantityText={quantityText}
                    onQuantityTextChange={setQuantityText}
                    onQuantityChange={setQuantity}
                  />
                  <div>
                    Want a custom size or style? Let me know how I can help at{' '}
                    <a
                      href="mailto:julian@1940s.nyc"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      julian@1940s.nyc
                    </a>
                  </div>
                  <OrderSummary
                    totalCents={total}
                    canOrder={!isCheckingOut && !!variant && isQuantityValid}
                    onAddToCart={addToCart}
                    onCheckout={() => void checkout()}
                  />
                </div>
              </div>
            )}

            {photoIdentifier && (
              <ArchivesCard
                photoIdentifier={photoIdentifier}
                isOnlyOption={photo !== null && photo.collection !== '1940'}
                className={stylesheet.archives}
              />
            )}
          </>
        )}
      </div>
    </FourtiesModal>
  );
}

export function openPrintModal(photoIdentifier: string): void {
  usePrintCheckoutStore.getState().open(photoIdentifier);
}

export function showPrintOrderPlaced(): void {
  usePrintCheckoutStore.getState().showOrderPlaced();
}
