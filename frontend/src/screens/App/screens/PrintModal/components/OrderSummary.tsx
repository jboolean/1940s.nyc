import React from 'react';
import { NumericFormat } from 'react-number-format';

import Button from 'shared/components/Button';
import TextButton from 'shared/components/TextButton';
import useLoginStore from 'shared/stores/LoginStore';
import stylesheet from './OrderSummary.less';

// The total, who is ordering, and the buttons that add to the cart or check out.
export default function OrderSummary({
  totalCents,
  canOrder,
  onAddToCart,
  onCheckout,
}: {
  totalCents: number;
  canOrder: boolean;
  onAddToCart: () => void;
  onCheckout: () => void;
}): React.JSX.Element {
  const emailAddress = useLoginStore((state) => state.emailAddress);
  const logout = useLoginStore((state) => state.logout);

  return (
    <div className={stylesheet.orderSummary}>
      <div>
        <NumericFormat
          displayType="text"
          prefix="$"
          value={totalCents / 100}
          decimalScale={totalCents % 100 === 0 ? 0 : 2}
          fixedDecimalScale
          data-testid="print-total"
        />{' '}
        <span className={stylesheet.finePrint}>Shipping will be added</span>
      </div>
      {emailAddress ? (
        <p className={stylesheet.finePrint}>
          You are logged in as <i>{emailAddress}</i>.{' '}
          <TextButton onClick={logout}>Not me, log out</TextButton>
        </p>
      ) : null}
      <div className={stylesheet.buttonRow}>
        <Button
          buttonStyle="secondary"
          onClick={onAddToCart}
          disabled={!canOrder}
          data-testid="print-add-to-cart-button"
        >
          Add to cart
        </Button>
        <Button
          buttonStyle="primary"
          onClick={onCheckout}
          disabled={!canOrder}
          data-testid="print-checkout-button"
        >
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
}
