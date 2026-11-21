import React from 'react';

import { forgeImgSrc } from '../../ViewerPane/components/ImageStack';
import { PrintFrame } from '../utils/PrintCheckoutApi';
import FramedPhotoPreview from './FramedPhotoPreview';

// The photo being ordered, inside its frame when the product is a framed print.
export default function PhotoPreview({
  photoIdentifier,
  frame,
  className,
}: {
  photoIdentifier: string;
  frame?: PrintFrame;
  className?: string;
}): React.JSX.Element {
  const src = forgeImgSrc(photoIdentifier, '420-jpg');
  if (frame) {
    return (
      <FramedPhotoPreview
        moulding={frame.moulding}
        printShortSideInches={frame.printShortSideInches}
        printLongSideInches={frame.printLongSideInches}
        src={src}
        alt="The photo you are ordering, framed"
        className={className}
        imgTestId="print-thumbnail"
      />
    );
  }
  return (
    <img
      src={src}
      alt="The photo you are ordering"
      className={className}
      data-testid="print-thumbnail"
    />
  );
}
