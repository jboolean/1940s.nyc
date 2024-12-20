import React, { ImgHTMLAttributes } from 'react';

import classNames from 'classnames';

import { PHOTO_BASE } from 'shared/utils/apiConstants';

import ColorLayer from './ColorLayer';
import { View } from './ImageSwitcher';

import preloadImage from 'shared/utils/preloadImage';
import stylesheet from './ImageStack.less';

type Props = {
  photoIdentifier: string;
  imgProps?: Omit<ImgHTMLAttributes<unknown>, 'src'>;
  className: string;
};

const forgeBaseImageSrc = (photoIdentifier: string): string =>
  `${PHOTO_BASE}/720-jpg/${photoIdentifier}.jpg`;

/**
 * An ImageStack keeps all the layers for one photo aligned and combined so they can be treated as one.
 * Layers: Base layer, high res layer, color layer.
 */
export default function ImageStack({
  photoIdentifier,
  imgProps,
  className,
}: Props): JSX.Element | null {
  const baseImageSrc = forgeBaseImageSrc(photoIdentifier);

  return (
    <div className={className}>
      <ColorLayer
        key={photoIdentifier}
        photoIdentifier={photoIdentifier}
        className={stylesheet.image}
      />
      <img
        data-image-type="base"
        {...imgProps}
        src={baseImageSrc}
        className={classNames(stylesheet.image, imgProps.className)}
      />
    </div>
  );
}
export function makeImageSwitcherView(props: Props): View {
  const imgSrc = forgeBaseImageSrc(props.photoIdentifier);
  return {
    key: props.photoIdentifier,
    element: <ImageStack {...props} />,
    preload: () => preloadImage(imgSrc),
  };
}
