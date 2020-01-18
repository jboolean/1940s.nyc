import React from 'react';

import mapboxgl from 'mapbox-gl';
import classnames from 'classnames';

import * as overlays from './overlays';

export { OverlayId } from './overlays';

import stylesheet from './MainMap.less';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1/draft'
  : 'mapbox://styles/julianboilen/ck5jrzrs11r1p1imia7qzjkm1';

const PHOTO_LAYER = 'photos-1940s';

interface Props {
  onPhotoClick: (photoIdentifier: string) => void;
  className?: string;
  panOnClick: boolean;
  activePhotoIdentifier?: string;
  overlay: overlays.OverlayId;
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
      overlays.installLayers(this.map, PHOTO_LAYER);

      map.setLayoutProperty(PHOTO_LAYER + '-active', 'visibility', 'visible');

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
      prevProps.overlay !== this.props.overlay
    ) {
      this.syncUI();
    }
  }

  syncUI(): void {
    this.map.setFilter(PHOTO_LAYER + '-active', [
      '==',
      ['get', 'photoIdentifier'],
      this.props.activePhotoIdentifier,
    ]);

    overlays.setOverlay(this.map, this.props.overlay);
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

  goTo(center: mapboxgl.LngLatLike): void {
    this.map.easeTo({
      zoom: 17.5,
      center,
    });
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
