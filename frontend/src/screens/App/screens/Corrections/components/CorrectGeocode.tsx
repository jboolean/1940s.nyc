import React from 'react';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import uniqueId from 'lodash/uniqueId';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from '../stores/CorrectionsStore';

import Button from 'shared/components/Button';
import FieldSet from 'shared/components/FieldSet';

import { PHOTO_BASE } from 'shared/utils/apiConstants';
import CoordinateInput from './CoordinateInput';
import LocationPickerModal from './LocationPickerModal';

import stylesheet from './CorrectGeocode.less';

export default function CorrectGeocode(): JSX.Element {
  const {
    alternatesSelections,
    toggleAlternateSelection,
    openMap,
    correctedLng,
    correctedLat,
    setCorrectedLngLat,
  } = useCorrectionsStore();
  const { previousLng: defaultLng, previousLat: defaultLat } =
    useCorrectionsStoreComputeds();
  const { isLoginValidated } = useLoginStore();

  const idPrefix = uniqueId('corrections-');

  const handleAlternateSelectionChange = (identifier: string): void => {
    toggleAlternateSelection(identifier);
  };

  return (
    <FieldSet disabled={!isLoginValidated}>
      <FieldSet.Legend>Correct map placement</FieldSet.Legend>

      <p>Fix where the dot for this photo appears on the map.</p>

      <div className={stylesheet.coordinateInputRow}>
        <CoordinateInput
          name="lat"
          label="Latitude"
          placeholder={defaultLat}
          value={correctedLat}
          onValueChange={(newValue) =>
            setCorrectedLngLat(correctedLng ?? null, newValue)
          }
          rangeMin={-90}
          rangeMax={90}
        />
        <span style={{ verticalAlign: 'bottom' }}>, </span>
        <CoordinateInput
          name="lng"
          label="Longitude"
          placeholder={defaultLng}
          value={correctedLng}
          onValueChange={(newValue) =>
            setCorrectedLngLat(newValue ?? null, correctedLat)
          }
          rangeMin={-180}
          rangeMax={180}
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

      {!isEmpty(alternatesSelections) ? (
        <fieldset className={stylesheet.alternates}>
          <legend>Also move these other photos at the same location?</legend>
          <p>
            If they are not moved together they will be dissociated. 80s photos
            left without a 40s photo at the same location are hidden from the
            site.
          </p>
          <div>
            <div className={stylesheet.alternatesCheckboxes}>
              {map(alternatesSelections, (selected, identifier) => (
                <React.Fragment key={identifier}>
                  <input
                    id={`${idPrefix}-${identifier}`}
                    type="checkbox"
                    name={identifier}
                    checked={selected}
                    onChange={() => {
                      handleAlternateSelectionChange(identifier);
                    }}
                    className={stylesheet.alternateCheckbox}
                  />
                  <label htmlFor={`${idPrefix}-${identifier}`}>
                    <img
                      alt={identifier}
                      src={`${PHOTO_BASE}/420-jpg/${identifier}.jpg`}
                      className={stylesheet.thumbnail}
                      title={identifier}
                      draggable={false}
                    />
                  </label>
                </React.Fragment>
              ))}
            </div>
          </div>
        </fieldset>
      ) : (
        <p>
          <i>No other photos at this location.</i>
        </p>
      )}
    </FieldSet>
  );
}
