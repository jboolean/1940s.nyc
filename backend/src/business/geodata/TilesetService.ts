import required from '../utils/required';
import FormData from 'form-data';
import mapboxApi from '../utils/MapboxApi';
import { AxiosError } from 'axios';

const MAPBOX_USER = 'julianboilen';
const STAGE = required(process.env.STAGE, 'STAGE');
const TILESET_SOURCE_ID = `${STAGE}-fourtiesnyc`;
const TILESET_ID = `${MAPBOX_USER}.${STAGE}-fourtiesnyc-photos`;

const PHOTOS_RECIPIE = {
  version: 1,
  layers: {
    photos: {
      source: `mapbox://tileset-source/${MAPBOX_USER}/${TILESET_SOURCE_ID}`,
      minzoom: 0,
      maxzoom: 16,
    },
  },
};

export async function uploadTilesetSource(
  data: NodeJS.ReadableStream
): Promise<void> {
  const form = new FormData();

  form.append('file', data, { filename: 'file' });

  return mapboxApi({
    method: 'put',
    url: `/tilesets/v1/sources/${MAPBOX_USER}/${TILESET_SOURCE_ID}`,
    data: form,
    headers: {
      ...form.getHeaders(),
    },
    maxRedirects: 0,
  }).then((response) => {
    console.log(response.data);
  });
}

export async function tilesetExists(): Promise<boolean> {
  try {
    await mapboxApi({
      method: 'get',
      url: `/tilesets/v1/${TILESET_ID}`,
    });
    return true;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function createTileset(): Promise<void> {
  await mapboxApi({
    method: 'post',
    url: `/tilesets/v1/${TILESET_ID}`,
    data: {
      recipe: PHOTOS_RECIPIE,
      name: `${STAGE} 1940s.nyc Photos`,
      private: true,
    },
  });
}

export async function publishTileset(): Promise<void> {
  const resp = await mapboxApi({
    method: 'post',
    url: `/tilesets/v1/${TILESET_ID}/publish`,
  });

  console.log(resp.data);
}

export async function getGlobalQueueSize(): Promise<number> {
  const resp = await mapboxApi<{ total: number }>({
    method: 'put',
    url: `/tilesets/v1/queue`,
  });

  return resp.data.total;
}
