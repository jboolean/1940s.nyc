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
  const { alternatesSelections, toggleAlternateSelection } =
    useCorrectionsStore();
  const { isLoginValidated } = useLoginStore();

  const idPrefix = useElementId('corrections-');

  const handleAlternateSelectionChange = (identifier: string): void => {
    toggleAlternateSelection(identifier);
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
