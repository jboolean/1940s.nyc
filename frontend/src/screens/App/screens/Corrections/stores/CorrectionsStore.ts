import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import useLoginStore from 'shared/stores/LoginStore';
import { getAlternatePhotos, getPhoto, Photo } from 'shared/utils/photosApi';

type LngLat = [number, number];

const DEFAULT_LNG_LAT: LngLat = [-73.99397, 40.7093];

interface State {
  isOpen: boolean;
  photoId: string | null;
  photo: Photo | null;
  alternatesSelections: Record<string, boolean>;

  isMapOpen: boolean;
  correctedLng: number | null;
  correctedLat: number | null;
  correctedAddress: string | null;
}

interface ComputedState {
  defaultLng: number;
  defaultLat: number;
  defaultAddress: string | null;
  canSubmit: boolean;
}

interface Actions {
  initialize: (photo: string) => void;
  close: () => void;
  toggleAlternateSelection: (identifier: string) => void;
  openMap: () => void;
  closeMap: () => void;
  setCorrectedLngLat: (lng: number, lat: number) => void;
  setCorrectedAddress: (address: string | null) => void;
}

const useCorrectionsStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    photoId: null,
    photo: null,
    alternatesSelections: {},
    isMapOpen: false,
    correctedLng: null,
    correctedLat: null,
    correctedAddress: null,

    initialize: (photo: string) => {
      set((draft) => {
        draft.photoId = photo;
        draft.isOpen = true;
        draft.photo = null;
        draft.alternatesSelections = {};
        draft.isMapOpen = false;
        draft.correctedLng = null;
        draft.correctedLat = null;
        draft.correctedAddress = null;
      });

      useLoginStore.getState().initialize();

      getPhoto(photo)
        .then((photo) => {
          set((draft) => {
            draft.photo = photo;
          });
        })
        .catch((err) => {
          console.error(err);
        });

      getAlternatePhotos(photo)
        .then((alternates) => {
          set((draft) => {
            alternates.forEach(({ identifier }) => {
              if (identifier === photo) return;
              draft.alternatesSelections[identifier] = true;
            });
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },

    close: () => {
      set((draft) => {
        draft.isOpen = false;
      });
    },

    toggleAlternateSelection: (identifier: string) => {
      set((draft) => {
        draft.alternatesSelections[identifier] =
          !get().alternatesSelections[identifier];
      });
    },

    openMap: () => {
      set((draft) => {
        draft.isMapOpen = true;
      });
    },
    closeMap: () => {
      set((draft) => {
        draft.isMapOpen = false;
      });
    },
    setCorrectedLngLat: (lng: number | null, lat: number | null) => {
      set((draft) => {
        // round to 6 decimal places
        draft.correctedLng = lng;
        draft.correctedLat = lat;
      });
    },
    setCorrectedAddress: (address: string | null) => {
      set((draft) => {
        draft.correctedAddress = address;
      });
    },
  }))
);

export function useCorrectionsStoreComputeds(): ComputedState {
  const { photo, correctedAddress, correctedLat, correctedLng } =
    useCorrectionsStore();
  const defaultGeocode = photo?.geocodeResults?.find(
    (result) => !!result.lngLat
  );
  return {
    defaultLng: defaultGeocode?.lngLat.lng ?? DEFAULT_LNG_LAT[0],
    defaultLat: defaultGeocode?.lngLat.lat ?? DEFAULT_LNG_LAT[1],
    defaultAddress: photo?.address ?? null,
    canSubmit:
      correctedAddress !== null ||
      (correctedLat !== null && correctedLng !== null),
  };
}

export default useCorrectionsStore;
