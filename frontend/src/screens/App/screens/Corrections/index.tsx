import React from 'react';

import useLoginStore from 'shared/stores/LoginStore';
import useCorrectionsStore, {
  useCorrectionsStoreComputeds,
} from './stores/CorrectionsStore';

import Button from 'shared/components/Button';
import LoginForm from 'shared/components/LoginForm';
import FourtiesModal from 'shared/components/Modal';
import CorrectAddress from './components/CorrectAddress';
import CorrectGeocode from './components/CorrectGeocode';
import PhotoMetadata from './components/PhotoMetadata';

import stylesheet from './Corrections.less';
import FieldSet from 'shared/components/FieldSet';
import SelectAlternates from './components/SelectAlternates';

const CorrectionsDialogContent = (): JSX.Element | null => {
  const { photo, submit, correctionType, setCorrectionType } =
    useCorrectionsStore();
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
          <LoginForm requireVerifiedEmail />
        </FieldSet>

        <FieldSet>
          <FieldSet.Legend>What would you like to correct?</FieldSet.Legend>
          <Button
            type="button"
            buttonStyle="secondary"
            isActive={correctionType === 'geocode'}
            onClick={() => setCorrectionType('geocode')}
            disabled={!isLoginValidated}
          >
            Map position
          </Button>
          <Button
            type="button"
            buttonStyle="secondary"
            isActive={correctionType === 'address'}
            onClick={() => setCorrectionType('address')}
            disabled={!isLoginValidated}
          >
            Address
          </Button>
        </FieldSet>

        {correctionType === 'geocode' ? <CorrectGeocode /> : null}
        {correctionType === 'address' ? <CorrectAddress /> : null}

        {correctionType !== null ? (
          <SelectAlternates
            description={
              correctionType === 'geocode' ? (
                <>
                  Are these photos of the same place? If they are not moved
                  together they will be dissociated. <br />
                  80s photos left without a 40s photo at the same location are
                  hidden from the site.
                </>
              ) : (
                <>
                  Are these photos of the same place? Select photos to update
                  the address for all of them.
                </>
              )
            }
          />
        ) : null}

        <p>
          Corrections are not immediate. They are processed nightly and will be
          visible tomorrow.
        </p>
        <p className={stylesheet.smallPrint}>
          This is a new feature. Send feedback to{' '}
          <a href="mailto:julian@1940s.nyc" target="_blank" rel="noreferrer">
            julian@1940s.nyc
          </a>
          .
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
  const { isOpen, isConfirmationOpen } = useCorrectionsStore(
    ({ isOpen, isConfirmationOpen }) => ({
      isOpen,
      isConfirmationOpen,
    })
  );
  const onRequestClose = useCorrectionsStore((state) => state.close);

  return (
    <>
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
      <FourtiesModal
        isOpen={isConfirmationOpen}
        onRequestClose={onRequestClose}
        size="small"
        isCloseButtonVisible={true}
      >
        <h1>Thank you!</h1>
        <p>
          Your correction has been submitted. Corrections are processed nightly
          and will be visible tomorrow.
        </p>
      </FourtiesModal>
    </>
  );
}

// expose the store so the initialize action can be called from wherever the button is
export { useCorrectionsStore };
