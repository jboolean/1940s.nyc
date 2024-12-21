import React, { RefObject } from 'react';

import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import stylesheet from './Overlay.less';

// Encapsulates overlay logic for fading children in and out
export default function Overlay({
  className,
  overlayRef,
  children,
}: React.PropsWithChildren<{
  className?: string;
  overlayRef?: RefObject<HTMLDivElement>;
}>): JSX.Element {
  // This feature flag is useful in development to prevent the overlay from disappearing
  const alwaysShowOverlay = useFeatureFlag(FeatureFlag.ALWAYS_SHOW_OVERLAY);

  const [isOverlayVisible, setIsOverlayVisible] =
    React.useState(alwaysShowOverlay);
  const timeoutRef = React.useRef<number | null>(null);

  // peek in so people can see this overlay exists
  React.useEffect(() => {
    setIsOverlayVisible(true);
    const timeout = window.setTimeout(() => {
      if (!alwaysShowOverlay) setIsOverlayVisible(false);
    }, 5_000);

    timeoutRef.current = timeout;

    return (): void => {
      clearTimeout(timeout);
    };
  }, [alwaysShowOverlay]);

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
    if (alwaysShowOverlay) {
      return;
    }
    setIsOverlayVisible(false);
  };

  return (
    <div
      className={classnames(stylesheet.overlay, className, {})}
      onPointerOver={handleStartHover}
      onPointerLeave={handleEndHover}
      onPointerDown={handlePointerDown}
      ref={overlayRef}
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
