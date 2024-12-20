import React, { ImgHTMLAttributes } from 'react';

import classNames from 'classnames';
import { PHOTO_BASE } from 'shared/utils/apiConstants';
import preloadImage from 'shared/utils/preloadImage';
import ColorLayer from './ColorLayer';
import stylesheet from './ImageStack.less';
import { View } from './ImageSwitcher';

type Props = {
  photoIdentifier: string;
  imgProps?: Omit<ImgHTMLAttributes<unknown>, 'src'>;
  className: string;
  isFullResVisible?: boolean;
};

type ImageFormat = '720-jpg' | '420-jpg' | 'jpg';

const forgeImgSrc = (
  photoIdentifier: string,
  format: ImageFormat = '720-jpg'
): string => `${PHOTO_BASE}/${format}/${photoIdentifier}.jpg`;

function HighResLayer({
  photoIdentifier,
}: {
  photoIdentifier: string;
}): JSX.Element {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <img
      data-image-type="high-res"
      src={forgeImgSrc(photoIdentifier, 'jpg')}
      className={classNames(stylesheet.image, stylesheet.overlayLayer)}
      onLoad={() => setLoaded(true)}
      style={{ opacity: loaded ? 1 : 0 }}
    />
  );
}

/**
 * An ImageStack keeps all the layers for one photo aligned and combined so they can be treated as one.
 * Layers: Base layer, high res layer, color layer.
 */
export default function ImageStack({
  photoIdentifier,
  imgProps,
  className,
  isFullResVisible,
}: Props): JSX.Element | null {
  const baseImageSrc = forgeImgSrc(photoIdentifier);

  return (
    <div className={className}>
      {isFullResVisible && (
        <HighResLayer
          key={'high-res_' + photoIdentifier}
          photoIdentifier={photoIdentifier}
        />
      )}
      <ColorLayer
        key={'color_' + photoIdentifier}
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
  const imgSrc = forgeImgSrc(props.photoIdentifier);
  return {
    key: props.photoIdentifier,
    element: <ImageStack key={props.photoIdentifier} {...props} />,
    preload: () => preloadImage(imgSrc),
  };
}
