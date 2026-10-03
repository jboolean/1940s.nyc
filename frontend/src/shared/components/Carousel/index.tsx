import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

import preloadImage from 'shared/utils/preloadImage';
import stylesheet from './Carousel.less';

interface Image {
  src: string;
  objectPosition: string;
  alt?: string;
}

const INTERVAL_MS = 7000;

export default function Carousel({
  images,
  className,
}: {
  images: Image[];
  className: string;
}): React.JSX.Element {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const handle = setInterval(() => {
      setI((i2) => (i2 + 1) % images.length);
    }, INTERVAL_MS);
    return () => {
      clearInterval(handle);
    };
  }, [images.length]);

  // preload next image
  React.useEffect(() => {
    const nextI = (i + 1) % images.length;
    void preloadImage(images[nextI].src);
  }, [i, images]);

  const image = images[i];

  // SwitchTransition keeps the outgoing and incoming image mounted together, so each needs its own ref
  const nodeRefs = React.useRef(
    new Map<number, React.RefObject<HTMLImageElement | null>>()
  );
  let nodeRef = nodeRefs.current.get(i);
  if (!nodeRef) {
    nodeRef = React.createRef<HTMLImageElement>();
    nodeRefs.current.set(i, nodeRef);
  }

  return (
    <SwitchTransition mode="in-out">
      <CSSTransition
        key={i}
        nodeRef={nodeRef}
        timeout={{
          appear: 0,
          enter: 1000,
          exit: 0,
        }}
        classNames={{ ...stylesheet }}
      >
        <img
          ref={nodeRef}
          className={className}
          src={image.src}
          style={{ objectPosition: image.objectPosition }}
          alt={image.alt}
        />
      </CSSTransition>
    </SwitchTransition>
  );
}
