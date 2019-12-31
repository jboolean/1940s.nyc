import React from 'react';

import mapboxgl from 'mapbox-gl';
import classnames from 'classnames';

import stylesheet from './MainMap.less';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze/draft'
  : 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze';

const PHOTO_LAYER = 'photos-1940s';

interface Props {
  onPhotoClick: (photoIdentifier: string) => void;
  className?: string;
  panOnClick: boolean;
  activePhotoIdentifier?: string;
}

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

    map.addSource('arial-1924', {
      type: 'raster',
      tiles: ['https://maps.nyc.gov/xyz/1.0.0/photo/1924/{z}/{x}/{y}.png8'],
    });

    map.addLayer({
      id: 'arial-1924',
      source: 'arial-1924',
    });
  }

  componentDidUpdate(prevProps: Props): void {
    // Update the conditional color expression to make the active dot a different color
    if (!this.map.isStyleLoaded()) {
      return;
    }
    if (prevProps.activePhotoIdentifier !== this.props.activePhotoIdentifier) {
      this.map.setPaintProperty(PHOTO_LAYER, 'circle-color', [
        'case',
        ['==', ['get', 'photoIdentifier'], this.props.activePhotoIdentifier],
        'hsl(0, 99%, 31%)',
        'hsl(0, 99%, 0%)',
      ]);
    }
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
