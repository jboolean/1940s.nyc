import React from 'react';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from '../stores/CorrectionsStore';

import Button from 'shared/components/Button';
import FieldSet from 'shared/components/FieldSet';

import CoordinateInput from './CoordinateInput';
import LocationPickerModal from './LocationPickerModal';

import Labeled from 'shared/components/Labeled';
import stylesheet from './CorrectGeocode.less';

export default function CorrectGeocode(): JSX.Element {
  const { openMap, correctedLng, correctedLat, setCorrectedLngLat } =
    useCorrectionsStore();
  const { previousLng: defaultLng, previousLat: defaultLat } =
    useCorrectionsStoreComputeds();
  const { isLoginValidated } = useLoginStore();

  return (
    <FieldSet disabled={!isLoginValidated}>
      <FieldSet.Legend>Correct map position</FieldSet.Legend>

      <p>
        Fix where the dot for this photo appears on the map. Click{' '}
        <i>Select on map</i> to find the coordinates of a location.
      </p>

      <div className={stylesheet.coordinateInputRow}>
        <Labeled
          labelText="Latitude"
          renderInput={({ id }) => (
            <CoordinateInput
              id={id}
              name="lat"
              placeholder={defaultLat}
              value={correctedLat}
              onValueChange={(newValue) =>
                setCorrectedLngLat(correctedLng ?? null, newValue)
              }
              rangeMin={-90}
              rangeMax={90}
            />
          )}
        />
        <span style={{ verticalAlign: 'bottom' }}>, </span>
        <Labeled
          labelText="Longitude"
          renderInput={({ id }) => (
            <CoordinateInput
              id={id}
              name="lng"
              placeholder={defaultLng}
              value={correctedLng}
              onValueChange={(newValue) =>
                setCorrectedLngLat(newValue ?? null, correctedLat)
              }
              rangeMin={-180}
              rangeMax={180}
            />
          )}
        />
        <Button
          buttonStyle="primary"
          buttonTheme="modal"
          className={stylesheet.openMapButton}
          onClick={openMap}
        >
          Select on map
        </Button>
        <LocationPickerModal />
      </div>
    </FieldSet>
  );
}
