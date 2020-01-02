import React from 'react';

import mapboxgl from 'mapbox-gl';
import classnames from 'classnames';

import stylesheet from './MainMap.less';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze/draft'
  : 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze';

const PHOTO_LAYER = 'photos-1940s';

const LAYER_IDS = [
  PHOTO_LAYER,
  'arial-1924',
  'arial-1951',
  'district-1937',
  'atlas-1956',
] as const;
const ARIAL_LAYERS = [
  'arial-1924',
  'arial-1951',
  'district-1937',
  'atlas-1956',
];

export type LayerId = typeof LAYER_IDS[number];

interface Props {
  onPhotoClick: (photoIdentifier: string) => void;
  className?: string;
  panOnClick: boolean;
  activePhotoIdentifier?: string;
  layer: LayerId;
}

const NYC_ATTRIBUTION =
  '© City of New York <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>';

export default class MainMap extends React.PureComponent<Props> {
  private mapContainer: Element;
  private map: mapboxgl.Map;

  componentDidMount(): void {
    const map = (this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: MAPBOX_STYLE,
      center: [-73.927, 40.734],
      zoom: 11.16,
      maxBounds: [
        [-74.25908989999999, 40.4773991], // SW
        [-73.70027209999999, 40.9175771], // NE
      ],
      hash: true,
    }));

    map.on('click', PHOTO_LAYER, e => {
      const { panOnClick, onPhotoClick } = this.props;
      if (panOnClick) map.panTo(e.lngLat);
      const feature = e.features[0];
      onPhotoClick(feature.properties.photoIdentifier);
      // map.setPaintProperty(PHOTO_LAYER, 'circle-color', 'hsl(0, 99%, 31%)');
      // map.setFeatureState(feature, { active: true });
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('style.load', () => {
      [
        {
          url: 'https://maps.nyc.gov/xyz/1.0.0/photo/1924/{z}/{x}/{y}.png8',
          targetId: 'arial-1924',
          attribution: '[1924] ' + NYC_ATTRIBUTION,
        },
        {
          url: 'https://maps.nyc.gov/xyz/1.0.0/photo/1951/{z}/{x}/{y}.png8',
          targetId: 'arial-1951',
          attribution: '[1951] ' + NYC_ATTRIBUTION,
        },
        {
          url: 'https://nypl-tiles.1940s.nyc/1067/{z}/{x}/{y}.png',
          targetId: 'district-1937',
          attribution:
            '[1937] The Lionel Pincus & Princess Firyal Map Division, NYPL',
        },
        {
          url: 'https://nypl-tiles.1940s.nyc/1453/{z}/{x}/{y}.png',
          targetId: 'atlas-1956',
          attribution:
            '[1956] The Lionel Pincus & Princess Firyal Map Division, NYPL',
        },
        {
          url: 'https://maps.nyc.gov/xyz/1.0.0/carto/label-lt/{z}/{x}/{y}.png8',
          targetId: 'nyc-label',
          attribution: NYC_ATTRIBUTION,
        },
      ].forEach(mapSpec => {
        map.addSource(mapSpec.targetId, {
          type: 'raster',
          tiles: [mapSpec.url],
          attribution: mapSpec.attribution,
          tileSize: 256,
        });

        map.addLayer(
          {
            id: mapSpec.targetId,
            source: mapSpec.targetId,
            type: 'raster',
            layout: {
              visibility: 'none',
            },
          },
          PHOTO_LAYER
        );
      });

      this.syncUI();
    });
  }

  componentDidUpdate(prevProps: Props): void {
    // Update the conditional color expression to make the active dot a different color
    if (!this.map.isStyleLoaded()) {
      this.map.once('style.load', () => this.syncUI());
    }
    if (
      prevProps.activePhotoIdentifier !== this.props.activePhotoIdentifier ||
      prevProps.layer !== this.props.layer
    ) {
      this.syncUI();
    }
  }

  syncUI(): void {
    this.map.setPaintProperty(PHOTO_LAYER, 'circle-color', [
      'case',
      ['==', ['get', 'photoIdentifier'], this.props.activePhotoIdentifier],
      'hsl(0, 99%, 31%)',
      'hsl(0, 99%, 0%)',
    ]);

    const isArial = ARIAL_LAYERS.includes(this.props.layer);
    ARIAL_LAYERS.forEach(layerId => {
      this.map.setLayoutProperty(
        layerId,
        'visibility',
        layerId === this.props.layer ? 'visible' : 'none'
      );
    });
    this.map.setLayoutProperty(
      'nyc-label',
      'visibility',
      isArial ? 'visible' : 'none'
    );
  }

  componentWillUnmount(): void {
    console.warn('unmounting');
    this.map.remove();
  }

  /**
   * Call if container has resized
   */
  resize(): void {
    this.map.resize();
  }

  render(): React.ReactNode {
    const { className: propsClassName } = this.props;

    return (
      <div
        className={classnames(stylesheet.map, propsClassName)}
        ref={el => (this.mapContainer = el)}
      />
    );
  }
}
