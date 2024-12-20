import React, { ImgHTMLAttributes } from 'react';

import { PHOTO_BASE } from 'shared/utils/apiConstants';

import { View } from './ImageSwitcher';

type Props = {
  photoIdentifier: string;
  imgProps?: Omit<ImgHTMLAttributes<unknown>, 'src'>;
  className: string;
};

const forgeBaseImageSrc = (photoIdentifier: string): string =>
  `${PHOTO_BASE}/720-jpg/${photoIdentifier}.jpg`;

function preloadImage(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.src = url;

    img.addEventListener('load', () => resolve());
    img.addEventListener('error', reject);
  });
}

export default function ImageStack({
  photoIdentifier,
  imgProps,
  className,
}: Props): JSX.Element | null {
  const baseImageSrc = forgeBaseImageSrc(photoIdentifier);

  return (
    <div className={className}>
      <img
        data-image-type="base"
        {...imgProps}
        src={baseImageSrc}
        style={{
          display: 'block',
          width: '100%',
        }}
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
