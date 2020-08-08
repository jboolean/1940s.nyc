import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

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
}): JSX.Element {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const handle = setInterval(() => {
      setI(i2 => (i2 + 1) % images.length);
    }, INTERVAL_MS);
    return () => {
      clearInterval(handle);
    };
  }, []);

  const image = images[i];

  return (
    <SwitchTransition mode="in-out">
      <CSSTransition
        key={i}
        timeout={{
          appear: 0,
          enter: 1000,
          exit: 0,
        }}
        classNames={{ ...stylesheet }}
      >
        <img
          className={className}
          src={image.src}
          style={{ objectPosition: image.objectPosition }}
          alt={image.alt}
        />
      </CSSTransition>
    </SwitchTransition>
  );
}
