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
    }));

    map.on('click', PHOTO_LAYER, e => {
      this.props.onPhotoClick(e.features[0].properties.photoIdentifier);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', PHOTO_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });
  }

  componentWillUnmount(): void {
    console.warn('unmounting');
    this.map.remove();
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
