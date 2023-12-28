import React from 'react';

import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import uniqueId from 'lodash/uniqueId';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useStoryDraftStoreComputeds,
} from './stores/CorrectionsStore';

import Button from 'shared/components/Button';
import FieldSet from 'shared/components/FieldSet';
import LoginForm from 'shared/components/LoginForm';
import FourtiesModal from 'shared/components/Modal';
import TextInput from 'shared/components/TextInput';
import PhotoMetadata from './components/PhotoMetadata';

import { PHOTO_BASE } from 'shared/utils/apiConstants';
import CoordinateInput from './components/CoordinateInput';
import LocationPickerModal from './components/LocationPickerModal';
import stylesheet from './Corrections.less';

const CorrectionsDialogContent = (): JSX.Element | null => {
  const {
    photo,
    alternatesSelections,
    toggleAlternateSelection,
    openMap,
    correctedLng,
    correctedLat,
    setCorrectedLngLat,
  } = useCorrectionsStore();
  const { defaultLng, defaultLat } = useStoryDraftStoreComputeds();

  const { isLoginValidated } = useLoginStore();

  const handleAlternateSelectionChange = (identifier: string): void => {
    toggleAlternateSelection(identifier);
  };

  const idPrefix = uniqueId('corrections-');

  return (
    <div className={stylesheet.modalContent}>
      <h1>Submit a Correction</h1>
      <div className={stylesheet.modalBody}>
        <p>
          Something amiss? Photos were placed automatically using the
          Borough/Block/Lot (BBL) or the address entered by the Department of
          Records. Use this tool to move this photo to new map coordinates or
          correct the tagged address.
        </p>

        <p>
          To find this photo&rsquo;s proper location, you may want to use an{' '}
          <a
            href="https://propertyinformationportal.nyc.gov/"
            target="_blank"
            rel="noreferrer"
          >
            NYC Tax Map
          </a>
          .
        </p>

        {photo ? <PhotoMetadata photo={photo} /> : null}

        <FieldSet className={stylesheet.fieldset} disabled={isLoginValidated}>
          <FieldSet.Legend>
            Log in
            {isLoginValidated ? null : (
              <span className={stylesheet.requiredAstrisk}> *</span>
            )}
          </FieldSet.Legend>

          <LoginForm />
        </FieldSet>
        <div className={stylesheet.correctionsGroup}>
          <FieldSet
            className={stylesheet.fieldset}
            disabled={!isLoginValidated}
          >
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
                className={stylesheet.correctionInput}
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
                className={stylesheet.correctionInput}
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

            <fieldset className={stylesheet.alternates}>
              <legend>
                Also move these other photos at the same location?
              </legend>
              <p>
                If they are not moved together they will be dissociated. 80s
                photos left without a 40s photo at the same location are hidden
                from the site.
              </p>

              {!isEmpty(alternatesSelections) ? (
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
              ) : (
                <p>
                  <i>No other photos at this location.</i>
                </p>
              )}
            </fieldset>
          </FieldSet>

          <FieldSet
            className={stylesheet.fieldset}
            disabled={!isLoginValidated}
          >
            <FieldSet.Legend>Correct address</FieldSet.Legend>

            <p>Fix the address sometimes displayed with this photo.</p>

            <div className={stylesheet.addressInputRow}>
              <TextInput
                type="text"
                name="address"
                aria-label="Address"
                className={classNames(
                  stylesheet.correctionInput,
                  stylesheet.addressInput
                )}
              />
            </div>
          </FieldSet>
        </div>

        <p>
          The map is updated nightly. Map corrections will be visible tomorrow.
        </p>
      </div>

      <div>
        <Button
          type="submit"
          buttonStyle="primary"
          disabled={!isLoginValidated}
          className={stylesheet.submitButton}
        >
          Submit correction
        </Button>
      </div>
    </div>
  );
};

export default function Corrections(): JSX.Element {
  const isOpen = useCorrectionsStore((state) => state.isOpen);
  const onRequestClose = useCorrectionsStore((state) => state.close);

  return (
    <FourtiesModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      size="x-large"
      isCloseButtonVisible={true}
    >
      <CorrectionsDialogContent />
    </FourtiesModal>
  );
}

// expose the store so the initialize action can be called from wherever the button is
export { useCorrectionsStore };
