import React from 'react';

import Checkbox from 'shared/components/Checkbox';
import TextInput from 'shared/components/TextInput';
import {
  isValidQuantity,
  MAX_QUANTITY,
  MIN_QUANTITY,
  parseQuantity,
} from '../utils/quantity';
import stylesheet from './PrintOptions.less';

export default function PrintOptions({
  colorize,
  onColorizeChange,
  quantityText,
  onQuantityTextChange,
  onQuantityChange,
}: {
  colorize: boolean;
  onColorizeChange: (colorize: boolean) => void;
  // Typed text, so the field can be cleared and retyped; only valid values reach onQuantityChange.
  quantityText: string;
  onQuantityTextChange: (text: string) => void;
  onQuantityChange: (quantity: number) => void;
}): React.JSX.Element {
  return (
    <div className={stylesheet.printOptions}>
      <label className={stylesheet.checkboxLabel}>
        <Checkbox
          checked={colorize}
          onChange={(e) => onColorizeChange(e.target.checked)}
          data-testid="print-colorize-checkbox"
        />
        AI colorized
      </label>
      <label className={stylesheet.label}>
        Quantity
        <TextInput
          type="number"
          min={MIN_QUANTITY}
          max={MAX_QUANTITY}
          step="1"
          value={quantityText}
          onChange={(e) => {
            onQuantityTextChange(e.target.value);
            const quantity = parseQuantity(e.target.value);
            if (isValidQuantity(quantity)) {
              onQuantityChange(quantity);
            }
          }}
          onBlur={() => {
            const quantity = parseQuantity(quantityText);
            if (!isValidQuantity(quantity)) {
              const clamped = Math.min(
                MAX_QUANTITY,
                Math.max(MIN_QUANTITY, quantity || 1)
              );
              onQuantityTextChange(String(clamped));
              onQuantityChange(clamped);
            }
          }}
          className={stylesheet.quantityInput}
          data-testid="print-quantity-input"
        />
      </label>
    </div>
  );
}
