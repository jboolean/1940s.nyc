import React from 'react';

import stylesheet from './BestOfBoroughBanner.less';

const VOTING_CLOSE_TIME = new Date(1602475140000);
const HIDE_KEY = 'hideBestOfBoroughBanner';

export default function BestOfBoroughBanner(): JSX.Element | null {
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
    localStorage.setItem(HIDE_KEY, 'true');
    setHidden(true);
  };

  const diffS = (VOTING_CLOSE_TIME.getTime() - now) / 1000;

  if (diffS < 0 || hidden) return null;

  const days = Math.floor(diffS / 86400);
  let remS = diffS - days * 86400;
  const hours = Math.floor(remS / 3600);
  remS -= hours * 3600;
  const mins = Math.floor(remS / 60);
  remS -= mins * 60;
  const sec = Math.floor(remS);

  return (
    <div className={stylesheet.container}>
      Vote for 1940s.nyc as <i>Best of Borough</i>. Voting ends {days}d {hours}h{' '}
      {mins}m {sec}s.{' '}
      <a
        href="https://www.bestof.nyc/listing/1940s.nyc"
        target="_blank"
        rel="noopener noreferrer"
        onClick={hide}
      >
        Vote Now →
      </a>
    </div>
  );
}
