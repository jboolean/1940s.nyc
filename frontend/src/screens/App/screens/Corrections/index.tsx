import React from 'react';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from './stores/CorrectionsStore';

import Button from 'shared/components/Button';
import FieldSet from 'shared/components/FieldSet';
import LoginForm from 'shared/components/LoginForm';
import FourtiesModal from 'shared/components/Modal';
import CorrectAddress from './components/CorrectAddress';
import CorrectGeocode from './components/CorrectGeocode';
import PhotoMetadata from './components/PhotoMetadata';

import stylesheet from './Corrections.less';

const CorrectionsDialogContent = (): JSX.Element | null => {
  const { photo, submit } = useCorrectionsStore();
  const { canSubmit } = useCorrectionsStoreComputeds();

  const { isLoginValidated } = useLoginStore();

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

        <PhotoMetadata photo={photo} />

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
          <CorrectGeocode />
          <CorrectAddress />
        </div>

        <p>
          The map is updated nightly. Map corrections will be visible tomorrow.
        </p>
      </div>

      <div>
        <Button
          type="submit"
          buttonStyle="primary"
          disabled={!(isLoginValidated && canSubmit)}
          className={stylesheet.submitButton}
          onClick={submit}
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
