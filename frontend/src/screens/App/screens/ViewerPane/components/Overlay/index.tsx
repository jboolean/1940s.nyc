import React from 'react';

import { CSSTransition } from 'react-transition-group';
import classnames from 'classnames';

import stylesheet from './Overlay.less';

export default function Overlay({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [isOverlayVisible, setIsOverlayVisible] = React.useState(false);

  // peek in so people can see this overlay exists
  React.useEffect(() => {
    setIsOverlayVisible(true);
    const timeout = setTimeout(() => {
      setIsOverlayVisible(false);
    }, 5_000);

    return (): void => {
      clearTimeout(timeout);
    };
  }, []);

  const handleMouseOver = (): void => {
    setIsOverlayVisible(true);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    // Touch happens first, prevent mouse events from firing
    e.preventDefault();
    setIsOverlayVisible(!isOverlayVisible);
  };

  const handleMouseOut = (): void => {
    console.log('mouse out', false);
    setIsOverlayVisible(false);
  };

  // Prevent events on the content from affecting the overlay state
  const stopPropagation: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      className={classnames(stylesheet.overlay, {})}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseOut}
      onTouchStart={handleTouchStart}
    >
      <CSSTransition
        in={isOverlayVisible}
        classNames={{ ...stylesheet }}
        appear
        timeout={150}
        mountOnEnter
        unmountOnExit
      >
        <div
          className={stylesheet.overlayContent}
          onTouchStart={stopPropagation}
        >
          {children}
        </div>
      </CSSTransition>
    </div>
  );
}
