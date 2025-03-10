import React from 'react';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore from '../stores/CorrectionsStore';

import { PHOTO_BASE } from 'shared/utils/apiConstants';

import FieldSet from 'shared/components/FieldSet';
import useElementId from 'shared/utils/useElementId';
import stylesheet from './SelectAlternates.less';

export default function SelectAlternates({
  description,
}: {
  description: React.ReactNode;
}): JSX.Element {
  const {
    alternatesSelections,
    toggleAlternateSelection,
    selectAllAlternates,
    deselectAllAlternates,
    alternatesAttested,
    setAlternatesAttested,
  } = useCorrectionsStore();
  const { isLoginValidated } = useLoginStore();

  const idPrefix = useElementId('corrections-');

  const handleAlternateSelectionChange = (identifier: string): void => {
    toggleAlternateSelection(identifier);
  };

  const handleAttestedChange = (): void => {
    setAlternatesAttested(!alternatesAttested);
  };

  return (
    <div>
      {!isEmpty(alternatesSelections) ? (
        <FieldSet
          className={stylesheet.alternates}
          disabled={!isLoginValidated}
        >
          <FieldSet.Legend>
            Also apply to these other photos from the same location?
          </FieldSet.Legend>
          <p>{description}</p>
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
            <div>
              <button
                type="button"
                onClick={selectAllAlternates}
                className={stylesheet.multiSelectButton}
              >
                Select All
              </button>
              {' | '}
              <button
                type="button"
                onClick={deselectAllAlternates}
                className={stylesheet.multiSelectButton}
              >
                Deselect All
              </button>
            </div>
            <label className={stylesheet.attestedLabel}>
              <input
                type="checkbox"
                id="attested"
                name="attested"
                checked={alternatesAttested}
                onChange={handleAttestedChange}
                disabled={!isLoginValidated}
                required
              />
              I&rsquo;ve reviewed these other photos and selected any of the
              same place
            </label>
          </div>
        </FieldSet>
      ) : (
        <p>
          <i>No other photos at this location.</i>
        </p>
      )}
    </div>
  );
}
