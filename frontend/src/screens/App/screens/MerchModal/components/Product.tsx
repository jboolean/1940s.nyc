import React from 'react';
import { MerchInternalVariant } from 'shared/utils/merch/Order';

import TotBagImageBack from '../../assets/tote-bag-small-back.png';
import TotBagImageDefault from '../../assets/tote-bag-small-default.png';
import ProductOption from './ProductOption';

interface ProductProps {
  product: { variant: MerchInternalVariant; priceAmount: number };
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export default function Product({
  product,
  quantity,
  onQuantityChange,
}: ProductProps): JSX.Element | null {
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
              in your choice of light, dark, red, or green; and a map of any NYC
              area of your choice on the back. After ordering, you&rsquo;ll
              receive an email with a link to customize your{' '}
              {quantity > 1 ? 'bags' : 'bag'}.
            </>
          }
          imageSrcHover={TotBagImageBack}
          imageSrcDefault={TotBagImageDefault}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
        />
      );
    default:
      return null;
  }
}
