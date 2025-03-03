import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { isEmpty } from 'lodash';
import useLoginStore from 'shared/stores/LoginStore';
import { getAlternatePhotos, getPhoto, Photo } from 'shared/utils/photosApi';
import {
  createAddressCorrection,
  createGeocodeCorrection,
} from '../shared/utils/correctionsApi';
interface State {
  isOpen: boolean;
  isConfirmationOpen: boolean;
  correctionType: 'geocode' | 'address' | null;
  photoId: string | null;
  photo: Photo | null;
  alternatesSelections: Record<string, boolean>;
  alternatesAttested: boolean;

  isMapOpen: boolean;
  correctedLng: number | null;
  correctedLat: number | null;
  correctedAddress: string | null;
}

interface ComputedState {
  previousLng: number | null;
  previousLat: number | null;
  previousAddress: string | null;
  canSubmit: boolean;
}

interface Actions {
  initialize: (photo: string) => void;
  close: () => void;
  toggleAlternateSelection: (identifier: string) => void;
  selectAllAlternates: () => void;
  deselectAllAlternates: () => void;
  setAlternatesAttested: (attested: boolean) => void;
  openMap: () => void;
  closeMap: () => void;
  setCorrectedLngLat: (lng: number, lat: number) => void;
  setCorrectedAddress: (address: string | null) => void;
  submit: () => void;
  setCorrectionType: (type: State['correctionType']) => void;
}

const useCorrectionsStore = create(
  immer<State & Actions>((set, get) => ({
    isOpen: false,
    isConfirmationOpen: false,
    photoId: null,
    photo: null,
    alternatesSelections: {},
    alternatesAttested: false,
    isMapOpen: false,
    correctedLng: null,
    correctedLat: null,
    correctedAddress: null,
    correctionType: null,

    initialize: (photo: string) => {
      set((draft) => {
        draft.photoId = photo;
        draft.isOpen = true;
        draft.photo = null;
        draft.alternatesSelections = {};
        draft.alternatesAttested = false;
        draft.isMapOpen = false;
        draft.correctedLng = null;
        draft.correctedLat = null;
        draft.correctedAddress = null;
        draft.correctionType = null;
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
              draft.alternatesSelections[identifier] = false;
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
        draft.isConfirmationOpen = false;
      });
    },

    toggleAlternateSelection: (identifier: string) => {
      set((draft) => {
        draft.alternatesSelections[identifier] =
          !get().alternatesSelections[identifier];
      });
    },

    selectAllAlternates: () => {
      set((draft) => {
        Object.keys(draft.alternatesSelections).forEach((identifier) => {
          draft.alternatesSelections[identifier] = true;
        });
      });
    },

    deselectAllAlternates: () => {
      set((draft) => {
        Object.keys(draft.alternatesSelections).forEach((identifier) => {
          draft.alternatesSelections[identifier] = false;
        });
      });
    },

    setAlternatesAttested: (attested: boolean) => {
      set((draft) => {
        draft.alternatesAttested = attested;
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
        draft.correctedLng = lng;
        draft.correctedLat = lat;
      });
    },
    setCorrectedAddress: (address: string | null) => {
      set((draft) => {
        draft.correctedAddress = address;
      });
    },

    submit: async () => {
      const {
        photoId,
        correctedLng,
        correctedLat,
        correctedAddress,
        correctionType,
      } = get();
      if (!photoId) return;

      // get selected alternates
      const alternates = Object.entries(get().alternatesSelections)
        .filter(([, isSelected]) => isSelected)
        .map(([identifier]) => identifier);

      const photos = [photoId, ...alternates];

      if (
        correctionType === 'geocode' &&
        typeof correctedLng === 'number' &&
        typeof correctedLat === 'number'
      ) {
        await createGeocodeCorrection(photos, correctedLat, correctedLng);
      }

      if (correctionType === 'address' && correctedAddress !== null) {
        await createAddressCorrection(photos, correctedAddress);
      }

      set((draft) => {
        draft.isOpen = false;
        draft.isConfirmationOpen = true;
      });
    },

    setCorrectionType: (type) => {
      set((draft) => {
        draft.correctionType = type;
      });
    },
  }))
);

export function useCorrectionsStoreComputeds(): ComputedState {
  const {
    photo,
    correctedAddress,
    correctedLat,
    correctedLng,
    correctionType,
    alternatesSelections,
    alternatesAttested,
  } = useCorrectionsStore();
  const defaultGeocode = photo?.effectiveGeocode;
  return {
    previousLng: defaultGeocode?.lngLat.lng ?? null,
    previousLat: defaultGeocode?.lngLat.lat ?? null,
    previousAddress: photo?.address ?? null,
    canSubmit:
      (alternatesAttested || isEmpty(alternatesSelections)) &&
      ((correctionType === 'geocode' &&
        correctedLat !== null &&
        correctedLng !== null) ||
        (correctionType === 'address' && correctedAddress !== null)),
  };
}

export default useCorrectionsStore;
