import axios from 'axios';
import { API_BASE } from './apiConstants';

export default axios.create({ baseURL: API_BASE });
