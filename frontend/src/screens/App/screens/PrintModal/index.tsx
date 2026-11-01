import React from 'react';
import { NumericFormat, numericFormatter } from 'react-number-format';
import { API_BASE } from 'utils/apiConstants';

import Button from 'shared/components/Button';
import Checkbox from 'shared/components/Checkbox';
import ExternalIcon from 'shared/components/ExternalIcon';
import FourtiesModal from 'shared/components/Modal';
import Select from 'shared/components/Select';
import TextButton from 'shared/components/TextButton';
import TextInput from 'shared/components/TextInput';
import { MerchInternalVariant } from 'shared/utils/merch/Order';
import useLoginStore from 'shared/stores/LoginStore';
import recordEvent from 'shared/utils/recordEvent';
import { forgeImgSrc } from '../ViewerPane/components/ImageStack';
import {
  NOT_AFFILIATED_MESSAGE,
  ORDER_PRINT_EXTERNAL_LINK_MESSAGE,
} from './archivesLink';
import stylesheet from './PrintModal.less';
import usePrintCheckoutStore from './stores/PrintCheckoutStore';

const ONLY_AT_ARCHIVES_MESSAGE =
  'Photos from the 1980s collection are only available from the Municipal Archives. ';

const ARCHIVES_DESCRIPTION =
  'Prints are made from a scan of the original negative on heavyweight luster inkjet paper. Fulfillment time is three to six weeks, but may vary. ';

function ArchivesCard({
  photoIdentifier,
  isOnlyOption,
}: {
  photoIdentifier: string;
  // True for 1980s photos, which can only be ordered from the Municipal Archives.
  isOnlyOption: boolean;
}): React.JSX.Element {
  return (
    <a
      className={stylesheet.archivesCard}
      href={`${API_BASE}/photos/${photoIdentifier}/buy-prints`}
      target="_blank"
      rel="noreferrer"
      data-testid="archives-card"
      onClick={() => {
        recordEvent({
          category: 'Image Viewer',
          action: 'Clicks Order Print From Archives',
        });
        alert(ORDER_PRINT_EXTERNAL_LINK_MESSAGE);
        return true;
      }}
    >
      {!isOnlyOption && (
        <div className={stylesheet.archivesLabel}>Alternative</div>
      )}
      <div className={stylesheet.archivesTitle}>
        Order from the Municipal Archives <ExternalIcon />
        <span className={stylesheet.visuallyHidden}>(opens in a new tab)</span>
      </div>
      <div>
        {isOnlyOption && ONLY_AT_ARCHIVES_MESSAGE}
        {ARCHIVES_DESCRIPTION}
        {NOT_AFFILIATED_MESSAGE}
      </div>
    </a>
  );
}

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

// An <option> can only hold text, so the money is formatted to a string here rather
// than rendered with NumericFormat.
function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return numericFormatter(String(dollars), {
    prefix: '$',
    decimalScale: dollars % 1 === 0 ? 0 : 2,
    fixedDecimalScale: true,
  });
}

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
  const emailAddress = useLoginStore((state) => state.emailAddress);
  const logout = useLoginStore((state) => state.logout);

  // Typed text, so the field can be cleared and retyped; only valid values reach the store.
  const [quantityText, setQuantityText] = React.useState('1');
  const parsedQuantity = /^\d+$/.test(quantityText)
    ? parseInt(quantityText, 10)
    : NaN;
  const isQuantityValid =
    parsedQuantity >= MIN_QUANTITY && parsedQuantity <= MAX_QUANTITY;

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
            {isLoading && <div>Loading…</div>}
            {errorMessage && (
              <div className={stylesheet.error} data-testid="print-error">
                {errorMessage}
              </div>
            )}

            {photo && canOrder && (
              <div className={stylesheet.form}>
                <img
                  src={forgeImgSrc(photo.identifier, '420-jpg')}
                  alt="The photo you are ordering"
                  className={stylesheet.thumbnail}
                  data-testid="print-thumbnail"
                />
                <div className={stylesheet.fields}>
                  <label>
                    Print
                    <Select
                      value={variant ?? ''}
                      onChange={(e) =>
                        setVariant(e.target.value as MerchInternalVariant)
                      }
                      className={stylesheet.productSelect}
                      data-testid="print-product-select"
                    >
                      {products.map((product) => (
                        <option key={product.variant} value={product.variant}>
                          {`${product.label} (${formatMoney(
                            product.priceAmount
                          )})`}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className={stylesheet.checkboxLabel}>
                    <Checkbox
                      checked={colorize}
                      onChange={(e) => setColorize(e.target.checked)}
                      data-testid="print-colorize-checkbox"
                    />
                    AI colorized
                  </label>
                  <label>
                    Quantity
                    <TextInput
                      type="number"
                      min={MIN_QUANTITY}
                      max={MAX_QUANTITY}
                      step="1"
                      value={quantityText}
                      onChange={(e) => {
                        setQuantityText(e.target.value);
                        const n = /^\d+$/.test(e.target.value)
                          ? parseInt(e.target.value, 10)
                          : NaN;
                        if (n >= MIN_QUANTITY && n <= MAX_QUANTITY) {
                          setQuantity(n);
                        }
                      }}
                      onBlur={() => {
                        if (!isQuantityValid) {
                          const clamped = Math.min(
                            MAX_QUANTITY,
                            Math.max(MIN_QUANTITY, parsedQuantity || 1)
                          );
                          setQuantityText(String(clamped));
                          setQuantity(clamped);
                        }
                      }}
                      className={stylesheet.quantityInput}
                      data-testid="print-quantity-input"
                    />
                  </label>
                  <div>
                    <NumericFormat
                      displayType="text"
                      prefix="$"
                      value={total / 100}
                      decimalScale={total % 100 === 0 ? 0 : 2}
                      fixedDecimalScale
                      data-testid="print-total"
                    />{' '}
                    <span className={stylesheet.finePrint}>
                      Shipping will be added
                    </span>
                  </div>
                  {emailAddress ? (
                    <p className={stylesheet.finePrint}>
                      You are logged in as <i>{emailAddress}</i>.{' '}
                      <TextButton onClick={logout}>Not me, log out</TextButton>
                    </p>
                  ) : null}
                  <Button
                    buttonStyle="secondary"
                    onClick={addToCart}
                    disabled={isCheckingOut || !variant || !isQuantityValid}
                    data-testid="print-add-to-cart-button"
                  >
                    Add to cart
                  </Button>
                  <Button
                    buttonStyle="primary"
                    onClick={() => void checkout()}
                    disabled={isCheckingOut || !variant || !isQuantityValid}
                    data-testid="print-checkout-button"
                  >
                    Continue to Checkout
                  </Button>
                </div>
              </div>
            )}

            {photoIdentifier && (
              <ArchivesCard
                photoIdentifier={photoIdentifier}
                isOnlyOption={photo !== null && photo.collection !== '1940'}
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
