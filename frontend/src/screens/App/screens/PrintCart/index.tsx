import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import FourtiesModal from 'shared/components/Modal';
import TextButton from 'shared/components/TextButton';
import TextInput from 'shared/components/TextInput';
import recordEvent from 'shared/utils/recordEvent';
import { useFeatureFlag } from '../../shared/stores/FeatureFlagsStore';
import FeatureFlag from '../../shared/types/FeatureFlag';
import { forgeImgSrc } from '../ViewerPane/components/ImageStack';
import {
  createPrintCheckoutSession,
  getAvailablePrintProducts,
  PrintProductApiResponse,
} from '../PrintModal/utils/PrintCheckoutApi';
import stylesheet from './PrintCart.less';
import usePrintCartStore, {
  CartItem,
  MAX_ITEM_QUANTITY,
} from './stores/PrintCartStore';

export function PrintCartButton({
  className,
}: {
  className?: string;
}): React.JSX.Element | null {
  const count = usePrintCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const open = usePrintCartStore((state) => state.open);
  const printOrdersEnabled = useFeatureFlag(FeatureFlag.PRINT_ORDERS);
  if (!printOrdersEnabled || count === 0) return null;
  return (
    <button
      type="button"
      className={className}
      data-testid="print-cart-button"
      onClick={() => {
        recordEvent({ category: 'Map', action: 'Click Print Cart' });
        open();
      }}
    >
      <span className={stylesheet.buttonLabel}>
        Cart
        <span
          className={stylesheet.badge}
          data-testid="print-cart-count"
          aria-label={`${count} in cart`}
        >
          {count}
        </span>
      </span>
    </button>
  );
}

// Typed text, so the field can be cleared and retyped; only values in range are applied.
function QuantityInput({
  quantity,
  onChange,
  disabled,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  disabled: boolean;
}): React.JSX.Element {
  const [text, setText] = React.useState(String(quantity));
  React.useEffect(() => setText(String(quantity)), [quantity]);
  const parse = (value: string): number =>
    /^\d+$/.test(value) ? parseInt(value, 10) : NaN;
  return (
    <TextInput
      type="number"
      min={1}
      max={MAX_ITEM_QUANTITY}
      step="1"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (n >= 1 && n <= MAX_ITEM_QUANTITY) onChange(n);
      }}
      onBlur={() => {
        const n = parse(text);
        const clamped = Math.min(MAX_ITEM_QUANTITY, Math.max(1, n || 1));
        setText(String(clamped));
        onChange(clamped);
      }}
      disabled={disabled}
      className={stylesheet.quantityInput}
      data-testid="print-cart-quantity"
    />
  );
}

export default function PrintCartModal(): React.JSX.Element {
  const {
    items,
    isOpen,
    isCheckingOut,
    close,
    removeItem,
    setQuantity,
    setCheckingOut,
  } = usePrintCartStore();
  const [products, setProducts] = React.useState<
    PrintProductApiResponse[] | null
  >(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setCheckingOut(false);
    setProducts(null);
    let cancelled = false;
    getAvailablePrintProducts()
      .then((result) => {
        if (!cancelled) setProducts(result);
      })
      .catch((err: unknown) => {
        console.error('Error loading print products', err);
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, setCheckingOut]);

  // Coming back from Stripe with the back button can restore the page as it was left.
  React.useEffect(() => {
    const onPageShow = (e: PageTransitionEvent): void => {
      if (e.persisted) close();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [close]);

  const priceOf = (item: CartItem): PrintProductApiResponse | undefined =>
    products?.find((p) => p.variant === item.variant);
  const hasUnavailable =
    products !== null && items.some((item) => !priceOf(item));
  const total = items.reduce(
    (sum, item) => sum + (priceOf(item)?.priceAmount ?? 0) * item.quantity,
    0
  );

  const checkout = async (): Promise<void> => {
    setCheckingOut(true);
    setErrorMessage(null);
    try {
      recordEvent({
        category: 'Prints',
        action: 'Click Cart Checkout',
        value: total || undefined,
      });
      const base = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
      const url = await createPrintCheckoutSession(
        items.map(({ photoIdentifier, variant, quantity, colorize }) => ({
          photoIdentifier,
          variant,
          quantity,
          colorize,
        })),
        `${base}?noWelcome=&printSuccess=cart${window.location.hash}`,
        `${base}?noWelcome=${window.location.hash}`
      );
      if (!usePrintCartStore.getState().isOpen) {
        setCheckingOut(false);
        return;
      }
      window.location.href = url;
      // If the navigation never happens, let the user try again.
      window.setTimeout(() => {
        setCheckingOut(false);
        setErrorMessage('Something went wrong. Please try again.');
      }, 5000);
    } catch (error) {
      console.error('Print cart checkout failed', error);
      setCheckingOut(false);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={close}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="large"
      className={stylesheet.cartModal}
    >
      <div className={stylesheet.content} data-testid="print-cart-modal">
        <h1>Your cart</h1>
        <div className={stylesheet.itemsArea}>
          {items.length === 0 && <p>Your cart is empty.</p>}
          {errorMessage && (
            <div className={stylesheet.error} data-testid="print-cart-error">
              {errorMessage}
            </div>
          )}
          {hasUnavailable && (
            <div
              className={stylesheet.error}
              data-testid="print-cart-unavailable"
            >
              {products.length === 0
                ? 'Prints are not available to order here right now. Please try again later.'
                : 'Some prints in your cart are no longer available. Remove them to continue.'}
            </div>
          )}
          <ul className={stylesheet.items}>
            {items.map((item) => {
              const product = priceOf(item);
              return (
                <li
                  key={`${item.photoIdentifier}|${item.variant}|${item.colorize}`}
                  className={stylesheet.item}
                  data-testid="print-cart-item"
                >
                  <img
                    src={forgeImgSrc(item.photoIdentifier, '420-jpg')}
                    alt=""
                    className={stylesheet.thumbnail}
                  />
                  <div className={stylesheet.details}>
                    <div className={stylesheet.name}>
                      {product?.label ?? item.label ?? item.variant}
                      {item.colorize ? ', AI colorized' : ''}
                    </div>
                    {product && (
                      <NumericFormat
                        displayType="text"
                        prefix="$"
                        value={product.priceAmount / 100}
                        decimalScale={product.priceAmount % 100 === 0 ? 0 : 2}
                        fixedDecimalScale
                      />
                    )}
                    <div className={stylesheet.controls}>
                      <label>
                        <span className={stylesheet.visuallyHidden}>
                          Quantity
                        </span>
                        <QuantityInput
                          quantity={item.quantity}
                          onChange={(quantity) => setQuantity(item, quantity)}
                          disabled={isCheckingOut}
                        />
                      </label>
                      <TextButton
                        onClick={() => removeItem(item)}
                        disabled={isCheckingOut}
                      >
                        Remove
                      </TextButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {items.length > 0 && products !== null && !hasUnavailable && (
          <div className={stylesheet.summary}>
            <NumericFormat
              displayType="text"
              prefix="$"
              value={total / 100}
              decimalScale={total % 100 === 0 ? 0 : 2}
              fixedDecimalScale
              data-testid="print-cart-total"
            />{' '}
            <span className={stylesheet.finePrint}>Shipping will be added</span>
          </div>
        )}
        {items.length > 0 && (
          <div className={stylesheet.buttonRow}>
            <Button
              buttonStyle="primary"
              onClick={() => void checkout()}
              disabled={isCheckingOut || products === null || hasUnavailable}
              data-testid="print-cart-checkout-button"
            >
              Continue to Checkout
            </Button>
          </div>
        )}
      </div>
    </FourtiesModal>
  );
}
