import api from 'utils/api';
import Gift from './Gift';

export default async function getGifts(): Promise<Gift[]> {
  const gifts = await api.get<Gift[]>('/tips/gifts');
  return gifts.data;
}
