import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import ANNOUNCEMENTS_REGISTRY from './AnnouncementRegistry';
import React from 'react';
import Announcement from './Announcement';

interface State {
  dismissals: string[];
}

interface Actions {
  dismiss(id: string): void;
}

interface ComputedState {
  announcementToDisplay: Announcement | null;
}

const useAnnouncementBannerStore = create(
  persist(
    immer<State & Actions>((set) => ({
      dismissals: [],
      dismiss: (id: string) => {
        set((state) => {
          state.dismissals.push(id);
        });
      },
    })),
    {
      name: 'announcement-banner',
      getStorage: () => localStorage,
    }
  )
);

export function useAnnouncementBannerStoreComputeds(): ComputedState {
  const { dismissals } = useAnnouncementBannerStore();
  const [now, setNow] = React.useState(Date.now());

  // Keep the current time up to date
  React.useEffect(() => {
    const handle = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(handle);
    };
  });

  const announcementToDisplay: Announcement | null = React.useMemo(() => {
    const activeAnnouncements = ANNOUNCEMENTS_REGISTRY.filter(
      (announcement) => {
        return (
          announcement.expiresAt.getTime() > now &&
          !dismissals.includes(announcement.id)
        );
      }
    );

    return activeAnnouncements[0] || null;
  }, [dismissals, now]);

  return {
    announcementToDisplay,
  };
}

export default useAnnouncementBannerStore;
