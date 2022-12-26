import React from 'react';
import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import Button from 'shared/components/Button';

import FourtiesModal from 'shared/components/Modal';
import Carousel from './Carousel';
import carouselImages from './carouselImages';

import stylesheet from './welcome.less';

interface Props {
  isOpen: boolean;
  onRequestClose: () => void;
}
export default function Welcome({
  isOpen,
  onRequestClose,
}: Props): JSX.Element {
  // Used to hide this annoying modal in development
  const isWelcomeDisabled = useFeatureFlag(FeatureFlag.DISABLE_WELCOME_MODAL);

  return (
    <FourtiesModal
      isOpen={isOpen && !isWelcomeDisabled}
      className={stylesheet.welcomeModal}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc
      size="large"
      isCloseButtonVisible={false}
    >
      <div className={stylesheet.imageContainer}>
        <Carousel className={stylesheet.image} images={carouselImages} />
      </div>

      <div className={stylesheet.textContainer}>
        <div className={stylesheet.text}>
          <h1>Street View of 1940s&nbsp;New&nbsp;York</h1>
          <p>
            Between 1939 and 1941, the Works Progress Administration
            collaborated with the New York City Tax Department to collect
            photographs of most buildings in the five boroughs of New York City.
            In 2018, the NYC Municipal Archives completed the digitization and
            tagging of these photos. This website places
            them&nbsp;on&nbsp;a&nbsp;map.
            <br />
            Zoom in! Every dot&nbsp;is&nbsp;a&nbsp;photo.
          </p>
          <hr />
          <p className={stylesheet.finePrint}>
            The photos on this site are property of the NYC Department of
            Records, <em>with which this site has no affilliation</em>. Prints
            and high-resolution digital copies may be ordered directly from the
            Municipal Archives using the link at the bottom of every photo. Use
            of these photos is subject to{' '}
            <a
              href="https://www1.nyc.gov/site/records/about/terms-and-conditions.page"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms & Conditions
            </a>
            . Only{' '}
            <a
              href="http://nycma.lunaimaging.com/luna/servlet/s/prc646"
              target="_blank"
              rel="noopener noreferrer"
            >
              publicly-viewable
            </a>
            , low-resolution, watermarked&nbsp;images&nbsp;are&nbsp;shown.{' '}
            <a
              href="https://www1.nyc.gov/assets/records/pdf/1940s%20Tax%20Department%20photographs_REC%200040_MASTER.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Collection guide.
            </a>
          </p>
          <p className={stylesheet.finePrint}>
            Photos were placed on the map via an automatic
            and&nbsp;imperfect&nbsp;process.
          </p>
          <p className={stylesheet.finePrint}>
            by{' '}
            <a
              href="http://julianboilen.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Julian Boilen
            </a>
          </p>
        </div>
        <div className={stylesheet.buttonContainer} onClick={onRequestClose}>
          <Button buttonStyle="primary" className={stylesheet.explore}>
            Start Exploring
          </Button>
        </div>
      </div>
    </FourtiesModal>
  );
}
