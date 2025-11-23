import classnames from 'classnames';
import React from 'react';
import { NumericFormat } from 'react-number-format';

import TextInput from 'shared/components/TextInput';
import { MerchInternalVariant } from 'shared/utils/merch/Order';

import stylesheet from '../../MerchModal.less';

export interface ProductOptionProps {
  title: React.ReactNode;
  variant: MerchInternalVariant;
  priceAmount: number;
  description: React.ReactNode;
  imageSrcHover?: string;
  imageSrcDefault: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export default function ProductOption({
  title,
  priceAmount,
  description,
  imageSrcHover: imageSrcBack,
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
