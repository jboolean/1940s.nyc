import { ColumnOptions } from 'typeorm';
import LngLat from '../../enum/LngLat';

const PointColumnOptions: ColumnOptions = {
  type: 'point',
  transformer: {
    from: (coords: { x: number; y: number } | null) =>
      coords ? { lng: coords.x, lat: coords.y } : null,
    to: (coords: LngLat | null) =>
      coords ? `(${coords.lng}, ${coords.lat})` : null,
  },
};

export default PointColumnOptions;
