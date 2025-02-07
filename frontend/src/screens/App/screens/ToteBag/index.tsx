import React from 'react';

import classNames from 'classnames';

import MainMap from '../MapPane/components/MainMap';

import stylesheet from './ToteBag.less';

export default function ToteBag(): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [attributionText, setAttributionText] = React.useState<string>('');

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const attributionEl = container.querySelector(
      '.mapboxgl-ctrl-attrib-inner'
    );
    if (!attributionEl) return;

    const observer = new MutationObserver(() => {
      const text = (attributionEl as HTMLElement).innerText;
      const improveText =
        attributionEl.querySelector('.mapbox-improve-map')?.textContent || '';

      if (text) {
        setAttributionText(text.replace(improveText, ''));
      }
    });

    observer.observe(attributionEl, { childList: true });

    return () => observer.disconnect();
  }, [containerRef]);

  return (
    <div
      className={classNames(stylesheet.container)}
      id="render-content"
      ref={containerRef}
    >
      <div className={stylesheet.front}>
        <h1 className={stylesheet.logo}>1940s.nyc</h1>
      </div>
      <div className={stylesheet.back}>
        <div className={stylesheet.map}>
          <MainMap panOnClick={false} overlay="default-map" />
        </div>
        <div className={stylesheet.box}>
          <div className={stylesheet.subhead}>
            <span className={stylesheet.hugLines}>
              Street-level view of 1940s New York with thousands of your stories
            </span>
          </div>
          <div className={stylesheet.attribution}>
            {/* I can't get the correct attributions to show based on what's in the viewport, it just shows all of them, so we say "May show" */}
            <span className={stylesheet.hugLines}>
              May show: {attributionText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
