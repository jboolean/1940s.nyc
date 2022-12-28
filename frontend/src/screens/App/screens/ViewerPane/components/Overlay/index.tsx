import React from 'react';

import { CSSTransition } from 'react-transition-group';
import classnames from 'classnames';

import stylesheet from './Overlay.less';

// Encapsulates overlay logic for fading children in and out
export default function Overlay({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [isOverlayVisible, setIsOverlayVisible] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  // peek in so people can see this overlay exists
  React.useEffect(() => {
    setIsOverlayVisible(true);
    const timeout = window.setTimeout(() => {
      setIsOverlayVisible(false);
    }, 5_000);

    timeoutRef.current = timeout;

    return (): void => {
      clearTimeout(timeout);
    };
  }, []);

  const cancelPeekTimeout = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleStartHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (e.pointerType !== 'mouse') {
      return;
    }
    setIsOverlayVisible(true);
    cancelPeekTimeout();
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    setIsOverlayVisible(!isOverlayVisible);
    cancelPeekTimeout();
  };

  const handleEndHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (e.pointerType !== 'mouse') {
      return;
    }
    setIsOverlayVisible(false);
  };

  return (
    <div
      className={classnames(stylesheet.overlay, {})}
      onPointerOver={handleStartHover}
      onPointerLeave={handleEndHover}
      onPointerDown={handlePointerDown}
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
          onPointerDown={handlePointerDown}
        >
          {children}
        </div>
      </CSSTransition>
    </div>
  );
}
