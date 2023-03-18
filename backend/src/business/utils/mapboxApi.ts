import required from '../utils/required';
import axios from 'axios';

const mapboxApi = axios.create({
  baseURL: 'https://api.mapbox.com',
  params: {
    access_token: required(process.env.MAPBOX_SK, 'MAPBOX_SK'),
  },
});

export default mapboxApi;
