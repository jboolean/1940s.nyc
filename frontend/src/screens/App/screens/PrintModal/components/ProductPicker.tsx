import React from 'react';
import { numericFormatter } from 'react-number-format';

import Select from 'shared/components/Select';
import { MerchInternalVariant } from 'shared/utils/merch/Order';
import { PrintProductApiResponse } from '../utils/PrintCheckoutApi';
import stylesheet from './ProductPicker.less';

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

export default function ProductPicker({
  products,
  variant,
  onChange,
}: {
  products: PrintProductApiResponse[];
  variant: MerchInternalVariant | null;
  onChange: (variant: MerchInternalVariant) => void;
}): React.JSX.Element {
  const selected = products.find((p) => p.variant === variant);
  return (
    <div className={stylesheet.productPicker}>
      <label className={stylesheet.label}>
        Print
        <Select
          value={variant ?? ''}
          onChange={(e) => onChange(e.target.value as MerchInternalVariant)}
          className={stylesheet.productSelect}
          data-testid="print-product-select"
        >
          {products.map((product) => (
            <option key={product.variant} value={product.variant}>
              {`${product.label} (${formatMoney(product.priceAmount)})`}
            </option>
          ))}
        </Select>
      </label>
      {selected?.description && (
        <p
          className={stylesheet.description}
          data-testid="print-product-description"
        >
          {selected.description}
        </p>
      )}
    </div>
  );
}
