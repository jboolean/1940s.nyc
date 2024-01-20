import axios from 'axios';
import FormData from 'form-data';
import required from './required';

type ColorizeImageWithAutoPromptBase64Response = {
  mime: string;
  image: string;
  caption: string;
};

type ColorizeImageWithAutoPromptBase64Request = {
  image: Buffer;

  resolution: 'watermarked-sd' | 'sd' | 'hd' | 'full-hd' | '4k';
  prompt?: string;
  standard_filter_id?: number;
  artistic_filter_id?: number;
  raw_captions?: boolean;
  pre_fix?: string;
  post_fix?: string;
  auto_color?: boolean;
  white_balance?: boolean;
  temperature?: number;
  saturation?: number;
};

const paletteApi = axios.create({
  baseURL: 'https://colorize-photo1.p.rapidapi.com/',
  headers: {
    'X-RapidAPI-Key': required(
      process.env.RAPIDAPI_API_KEY,
      'RAPIDAPI_API_KEY'
    ),
    'X-RapidAPI-Host': 'colorize-photo1.p.rapidapi.com',
    'Content-Type': 'multipart/form-data',
  },
});

function toFormData<T extends object>(request: T): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(request)) {
    if (key === 'image') {
      formData.append(key, value, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });
      continue;
    }
    if (typeof value === 'boolean') {
      formData.append(key, String(value));
      continue;
    }

    formData.append(key, value);
  }
  return formData;
}

export async function colorizeImageWithAutoPromptBase64(
  request: ColorizeImageWithAutoPromptBase64Request
): Promise<ColorizeImageWithAutoPromptBase64Response> {
  const formData = toFormData(request);

  const response =
    await paletteApi.post<ColorizeImageWithAutoPromptBase64Response>(
      '/colorize_image_with_auto_prompt_base64',
      formData
    );

  return response.data;
}
