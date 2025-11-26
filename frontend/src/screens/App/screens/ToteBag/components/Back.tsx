import React from 'react';

import MainMap from '../../MapPane/components/MainMap';

import stylesheet from '../ToteBag.less';

export default function ToteBag(): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [attributionText, setAttributionText] = React.useState<string>('');

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let attributionObserver: MutationObserver | null = null;

    const setupAttributionObserver = (attributionEl: Element): void => {
      attributionObserver = new MutationObserver(() => {
        const text = (attributionEl as HTMLElement).innerText;
        if (text) {
          setAttributionText(text);
        }
      });
      attributionObserver.observe(attributionEl, { childList: true });
    };

    const containerObserver = new MutationObserver(() => {
      const attributionEl = container.querySelector(
        '.maplibregl-ctrl-attrib-inner'
      );
      if (attributionEl) {
        setupAttributionObserver(attributionEl);
        containerObserver.disconnect();
      }
    });

    containerObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    const attributionEl = container.querySelector(
      '.maplibregl-ctrl-attrib-inner'
    );
    if (attributionEl) {
      setupAttributionObserver(attributionEl);
      containerObserver.disconnect();
    }

    return () => {
      containerObserver.disconnect();
      attributionObserver?.disconnect();
    };
  }, [containerRef]);

  return (
    <div className={stylesheet.back} ref={containerRef}>
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
          <span className={stylesheet.hugLines}>Maps: {attributionText}</span>
        </div>
      </div>
    </div>
  );
}
