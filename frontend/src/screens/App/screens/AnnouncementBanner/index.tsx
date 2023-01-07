import React from 'react';

import stylesheet from './AnnouncementBanner.less';
import useAnnouncementBannerStore, {
  useAnnouncementBannerStoreComputeds,
} from './AnnouncementBannerStore';

export default function AnnouncementBanner(): JSX.Element | null {
  const dismiss = useAnnouncementBannerStore((state) => state.dismiss);
  const { announcementToDisplay } = useAnnouncementBannerStoreComputeds();

  if (!announcementToDisplay) return null;

  const hide = (): void => {
    dismiss(announcementToDisplay.id);
  };

  return (
    <div className={stylesheet.container}>
      {announcementToDisplay.render()}{' '}
      <button className={stylesheet.hideButton} onClick={hide}>
        Hide
      </button>
    </div>
  );
}
