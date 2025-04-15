import React from 'react';

import pick from 'lodash/pick';
import mapboxgl from 'mapbox-gl';
import FourtiesModal from 'shared/components/Modal';
import useOrdersStore from '../shared/stores/OrdersStore';

import {
  installLayers,
  setOverlay,
} from 'screens/App/screens/MapPane/components/MainMap/overlays';
import Button from 'shared/components/Button';
import useElementId from 'shared/utils/useElementId';
import { MerchCustomizationOptions } from '../shared/utils/Order';
import stylesheet from './CustomizeModal.less';

const DEFAULT_LNG_LAT = {
  lng: -73.98196612358352,
  lat: 40.76808966119866,
} as const;

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

import OutlineDarkCremeImage from './assets/outline-dark-creme.png';
import OutlineGreenCremeImage from './assets/outline-green-creme.png';
import OutlineRedCremeImage from './assets/outline-red-creme.png';
import SolidCremeDarkImage from './assets/solid-creme-dark.png';
import SolidCremeGreenImage from './assets/solid-creme-green.png';
import SolidCremeRedImage from './assets/solid-creme-red.png';

const FRONT_STYLE_PRESETS = [
  {
    style: 'solid',
    foregroundColor: 'creme',
    backgroundColor: 'green',
    image: SolidCremeGreenImage,
  },
  {
    style: 'solid',
    foregroundColor: 'creme',
    backgroundColor: 'red',
    image: SolidCremeRedImage,
  },
  {
    style: 'solid',
    foregroundColor: 'creme',
    backgroundColor: 'dark',
    image: SolidCremeDarkImage,
  },
  {
    style: 'outline',
    foregroundColor: 'green',
    backgroundColor: 'creme',
    image: OutlineGreenCremeImage,
  },
  {
    style: 'outline',
    foregroundColor: 'red',
    backgroundColor: 'creme',
    image: OutlineRedCremeImage,
  },
  {
    style: 'outline',
    foregroundColor: 'dark',
    backgroundColor: 'creme',
    image: OutlineDarkCremeImage,
  },
] as const;

const STYLE_DEFAULTS = {
  style: 'solid',
  foregroundColor: 'creme',
  backgroundColor: 'green',
};

const CustomizeBack = (): JSX.Element => {
  const {
    customizing,
    draftCustomizationOptions,
    setDraftCustomizationOptions,
  } = useOrdersStore();

  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);

  const customizationOptions: MerchCustomizationOptions | undefined =
    customizing?.customizationOptions;

  const renderMap = React.useCallback((): void => {
    const startingPosition = [
      draftCustomizationOptions?.lng ??
        customizationOptions?.lng ??
        DEFAULT_LNG_LAT.lng,
      draftCustomizationOptions?.lat ??
        customizationOptions?.lat ??
        DEFAULT_LNG_LAT.lat,
    ] as [number, number];
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: startingPosition,
      maxBounds: [
        [-74.25908989999999, 40.4773991], // SW
        [-73.70027209999999, 40.9175771], // NE
      ],
      zoom: 17,
      hash: false,
    });

    map.current.on('style.load', () => {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      installLayers(map.current, 'photos-1940s', {
        fadeOverlays: false,
      });
      setOverlay(map.current, 'default-map');
    });

    map.current.on('moveend', () => {
      const center = map.current.getCenter();
      setDraftCustomizationOptions({
        ...STYLE_DEFAULTS,
        ...draftCustomizationOptions,
        lng: center.lng,
        lat: center.lat,
        variant: customizing.internalVariant,
      });
      setOverlay(map.current, 'default-map');
    });

    // Add marker for center position
    const marker = new mapboxgl.Marker({
      draggable: false,
      color: '#87b6a8',
    })
      .setLngLat(startingPosition)
      .addTo(map.current);

    map.current.on('move', () => {
      marker.setLngLat(map.current.getCenter());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const destroyMap = React.useCallback((): void => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  }, []);

  React.useEffect(() => {
    renderMap();
    return () => {
      destroyMap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <p>
        Your unique tote bag will be printed with a map of your favorite
        neighborhood. Drag the map so the marker is in the center of the area
        you want to feature.
        <br />
        Manhattan has a historic map, and looks great printed. Other areas use a
        modern map. All locations feature tags from the thousands of personal
        stories on the site, and dots for every photo. Printed zoom level is not
        adjustable.
      </p>

      <div ref={mapContainer} className={stylesheet.map} />
    </>
  );
};

const CustomizeFront = (): JSX.Element => {
  const {
    customizing,
    draftCustomizationOptions,
    setDraftCustomizationOptions,
  } = useOrdersStore();
  const selectedStyle = {
    style:
      draftCustomizationOptions?.style ??
      customizing?.customizationOptions.style ??
      STYLE_DEFAULTS.style,
    foregroundColor:
      draftCustomizationOptions?.foregroundColor ??
      customizing?.customizationOptions.foregroundColor ??
      STYLE_DEFAULTS.foregroundColor,
    backgroundColor:
      draftCustomizationOptions?.backgroundColor ??
      customizing?.customizationOptions.backgroundColor ??
      STYLE_DEFAULTS.backgroundColor,
  };

  const selectedKey = `${selectedStyle.style}-${selectedStyle.foregroundColor}-${selectedStyle.backgroundColor}`;
  const inputIdPrefix = useElementId('customize-front-style-preset');

  return (
    <>
      <p>Choose a style for the front of the bag.</p>

      <div className={stylesheet.frontStylePresets}>
        {FRONT_STYLE_PRESETS.map((stylePreset) => {
          const key = `${stylePreset.style}-${stylePreset.foregroundColor}-${stylePreset.backgroundColor}`;
          const id = inputIdPrefix + key;
          return (
            <React.Fragment key={key}>
              <input
                id={id}
                type="radio"
                checked={key === selectedKey}
                className={stylesheet.frontStylePresetInput}
                onChange={() => {
                  setDraftCustomizationOptions({
                    ...draftCustomizationOptions,
                    ...pick(
                      stylePreset,
                      'style',
                      'foregroundColor',
                      'backgroundColor'
                    ),
                  });
                }}
              />
              <label htmlFor={id}>
                <img src={stylePreset.image} alt={key} />
              </label>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

export default function CustomizeModal(): JSX.Element {
  const {
    draftCustomizationOptions,
    customizing,
    dismissCustomizing,
    step,
    saveCustomization,
    submitForPrinting,
    goToOtherSideOfBag,
  } = useOrdersStore();
  return (
    <FourtiesModal
      isOpen={!!customizing}
      onRequestClose={dismissCustomizing}
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      size="x-large"
      isCloseButtonVisible={true}
    >
      <div className={stylesheet.content}>
        <h1>Customize</h1>
        {step === 'back' && <CustomizeBack />}
        {step === 'front' && <CustomizeFront />}
        <div>
          <Button
            onClick={async (): Promise<void> => {
              if (draftCustomizationOptions) await saveCustomization();
              goToOtherSideOfBag();
            }}
            buttonStyle={'secondary'}
          >
            Customize other side 🔄
          </Button>
          <Button
            onClick={async (): Promise<void> => {
              await saveCustomization();
              await submitForPrinting();
            }}
            disabled={!draftCustomizationOptions}
            buttonStyle={'primary'}
          >
            Send for printing
          </Button>
        </div>
      </div>
    </FourtiesModal>
  );
}
