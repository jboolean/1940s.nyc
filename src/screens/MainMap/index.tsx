import React from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze/draft'
  : 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze';

const PHOTO_LAYER = 'photos-1940s';

export default class MainMap extends React.Component {
  private mapContainer: Element;
  private map: mapboxgl.Map;

  componentDidMount(): void {
    const map = (this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: MAPBOX_STYLE,
    }));

    map.on('click', PHOTO_LAYER, e => {
      window.open(
        `https://photos.1940s.nyc/${e.features[0].properties.photoIdentifier}`
      );
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
    this.map.remove();
  }

  render(): React.ReactNode {
    const style = {
      position: 'absolute' as 'absolute',
      top: '0',
      bottom: '0',
      width: '100%',
    };

    return <div style={style} ref={el => (this.mapContainer = el)} />;
  }
}
