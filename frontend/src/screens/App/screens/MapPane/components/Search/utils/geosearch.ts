import axios from 'axios';
import { FeatureCollection, Point } from 'geojson';

const NYC_GEOSEARCH_BASE = 'https://geosearch.planninglabs.nyc/v1';

const geosearch = axios.create({ baseURL: NYC_GEOSEARCH_BASE });

export function autocomplete(text: string): Promise<FeatureCollection<Point>> {
  return geosearch
    .get<FeatureCollection<Point>>('/autocomplete', { params: { text } })
    .then(resp => resp.data);
}

export function search(text: string): Promise<FeatureCollection<Point>> {
  return geosearch
    .get<FeatureCollection<Point>>('/search', { params: { text } })
    .then(resp => resp.data);
}
