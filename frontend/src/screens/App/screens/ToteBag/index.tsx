import React from 'react';

import classNames from 'classnames';

import BagBack from './components/Back';
import BagFront, { Color } from './components/Front';

import { useLocation } from 'react-router';
import stylesheet from './ToteBag.less';

export default function ToteBag(): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  return (
    <div
      className={classNames(stylesheet.container)}
      id="render-content"
      ref={containerRef}
    >
      <BagFront
        foregroundColor={
          (urlParams.get('foregroundColor') ?? undefined) as Color
        }
        backgroundColor={
          (urlParams.get('backgroundColor') ?? undefined) as Color
        }
        style={(urlParams.get('style') ?? undefined) as 'outline' | 'solid'}
      />
      <BagBack />
    </div>
  );
}
