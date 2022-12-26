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

  const handleStartHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (e.pointerType !== 'mouse') {
      console.log('not mouse');
      return;
    }
    console.log('mouse over');
    setIsOverlayVisible(true);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.target !== e.currentTarget) {
      console.log('not target for pointer down');
      return;
    }
    console.log('pointer down');
    setIsOverlayVisible(!isOverlayVisible);
  };

  const handleEndHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (e.pointerType !== 'mouse') {
      console.log('not mouse');
      return;
    }
    console.log('mouse out', false);
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
