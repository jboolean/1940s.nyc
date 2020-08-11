import React from 'react';

import Modal from 'react-modal';
import Carousel from './Carousel';
import carouselImages from './carouselImages';

import stylesheet from './welcome.less';

interface Props {
  isOpen: boolean;
  onRequestClose: () => void;
}
export default function({ isOpen, onRequestClose }: Props): JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      className={stylesheet.welcomeModal}
      bodyOpenClassName={stylesheet.bodyOpen}
      overlayClassName={stylesheet.overlay}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc
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
            photographs of every building in the five boroughs of New York City.
            In 2018, the NYC Municipal Archives completed the digitization and
            tagging of these photos. This website places
            them&nbsp;on&nbsp;a&nbsp;map.
            <br />
            Zoom in! Every dot&nbsp;is&nbsp;a&nbsp;photo.
          </p>
          <hr />
          <p className={stylesheet.finePrint}>
            The photos on this site are property of the NYC Department of
            Records, with which this site has no affilliation. Prints and
            high-resolution digital copies may be ordered directly from the
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
            , low-resolution, watermarked&nbsp;images&nbsp;are&nbsp;shown.
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
          <button type="button" className={stylesheet.explore}>
            Start Exploring
          </button>
        </div>
      </div>
    </Modal>
  );
}
