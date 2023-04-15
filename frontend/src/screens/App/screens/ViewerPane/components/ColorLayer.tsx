import React from 'react';

import { CSSTransition } from 'react-transition-group';
import useColorizationStore from '../stores/ColorizationStore';

import classNames from 'classnames';

import stylesheet from './ColorLayer.less';

export default function ColorLayer({
  photoIdentifier,
  className,
}: {
  photoIdentifier: string;
  className: string;
}): JSX.Element | null {
  const {
    colorEnabledForIdentifier,
    colorizedImageSrc,
    handleImageLoaded,
    isLoading,
  } = useColorizationStore();

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  const enabled = colorEnabledForIdentifier === photoIdentifier;

  // Sync loading state with store
  React.useEffect(() => {
    if (imageRef.current && enabled && isLoading && imageRef.current.complete) {
      handleImageLoaded();
    }
  }, [enabled, handleImageLoaded, imageRef.current?.complete, isLoading]);

  return (
    <>
      <CSSTransition
        appear={true}
        in={enabled && !isLoading}
        classNames={{ ...stylesheet }}
        timeout={{
          enter: 2000,
          exit: 1000,
        }}
      >
        <img
          ref={imageRef}
          className={classNames(stylesheet.colorLayer, className)}
          src={colorizedImageSrc}
          onLoad={() => {
            console.log('loaded', enabled);
            if (enabled) {
              handleImageLoaded();
            }
          }}
        />
      </CSSTransition>
    </>
  );
}
