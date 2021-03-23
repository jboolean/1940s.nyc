import React from 'react';

import stylesheet from './AnnouncementBanner.less';

const EVENT_TIME = new Date(1616536800000);
const HIDE_KEY = 'hideBloomingdaleBanner';
const HIDE_ON_CLICK = false;

export default function AnnouncementBanner(): JSX.Element | null {
  const [now, setNow] = React.useState(Date.now());
  const [hidden, setHidden] = React.useState(
    localStorage.getItem(HIDE_KEY) === 'true'
  );

  React.useEffect(() => {
    const handle = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(handle);
  }, []);

  const hide = (): void => {
    if (!HIDE_ON_CLICK) return;
    localStorage.setItem(HIDE_KEY, 'true');
    setHidden(true);
  };

  const diffS = (EVENT_TIME.getTime() - now) / 1000;

  if (diffS < 0 || hidden) return null;

  // const days = Math.floor(diffS / 86400);
  // let remS = diffS - days * 86400;
  // const hours = Math.floor(remS / 3600);
  // remS -= hours * 3600;
  // const mins = Math.floor(remS / 60);
  // remS -= mins * 60;
  // const sec = Math.floor(remS);

  return (
    <div className={stylesheet.container}>
      <a
        href="http://bit.ly/3f2mm25"
        target="_blank"
        rel="noopener noreferrer"
        onClick={hide}
      >
        Free virtual presentation
      </a>{' '}
      on 1940s.nyc and Bloomingdale neighborhood history Tuesday at 5:30pm EDT
    </div>
  );
}
