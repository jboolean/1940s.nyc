import React from 'react';
import classNames from 'classnames';

import FourtiesModal, { FourtiesModalProps } from 'shared/components/Modal';

import Carousel from 'shared/components/Carousel';
import stylesheet from './PhotoAsideModal.less';

type Props = FourtiesModalProps & {
  carouselProps: React.ComponentProps<typeof Carousel>;
};

export default function PhotoAsideModal({
  className,
  carouselProps,
  children,
  ...props
}: Props): JSX.Element {
  return (
    <FourtiesModal
      size="large"
      {...props}
      className={classNames(stylesheet.photoAsideModal, className)}
    >
      <div className={stylesheet.imageContainer}>
        <Carousel
          {...carouselProps}
          className={classNames(stylesheet.image, carouselProps.className)}
        />
      </div>

      <div className={stylesheet.rightOuter}>
        <div className={stylesheet.rightInner}>{children}</div>
      </div>
    </FourtiesModal>
  );
}
