import React from 'react';
import mapboxgl from 'mapbox-gl';

interface Props {
  options: Omit<mapboxgl.MapboxOptions, 'container'>;
  containerProps: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
}

export default class Map extends React.Component<Props, {}> {
  mapContainer: Element;
  map: mapboxgl.Map;

  componentDidMount(): void {
    const { options } = this.props;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      ...options,
    });
  }

  componentWillUnmount(): void {
    this.map.remove();
  }

  render(): JSX.Element {
    return (
      <div
        {...this.props.containerProps}
        ref={el => (this.mapContainer = el)}
      />
    );
  }
}
