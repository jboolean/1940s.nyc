import sharp from 'sharp';

type SharpInput = Parameters<typeof sharp>[0];

const ROI_PCT = 0.9;

const SAMPLE_WIDTH = 560;

const BLACK_PERCENTILE = 1;
const WHITE_PERCENTILE = 99;

const percentile = (values: Uint8ClampedArray, p: number): number => {
  const index = (p / 100) * (values.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return values[lower] + (values[upper] - values[lower]) * (index - lower);
};

// Normalize levels based on center of image, to ignore junk on the sides
export async function adjustLevels(input: SharpInput): Promise<Buffer> {
  const meta = await sharp(input).metadata();

  const { width, height } = meta;

  if (!width || !height) {
    console.warn('Image has no dimensions');
    return sharp(input).toBuffer();
  }

  const roi = {
    left: Math.floor((width * (1 - ROI_PCT)) / 2),
    top: Math.floor((height * (1 - ROI_PCT)) / 2),
    width: Math.floor(width * ROI_PCT),
    height: Math.floor(height * ROI_PCT),
  };

  const roiBuffer = await sharp(input)
    .extract(roi)
    .resize(SAMPLE_WIDTH)
    .raw()
    .toBuffer();

  // Calculate black and white points based on percentiles

  const pixelValues = new Uint8ClampedArray(roiBuffer);
  pixelValues.sort((a, b) => a - b);

  const blackPoint = percentile(pixelValues, BLACK_PERCENTILE);
  const whitePoint = percentile(pixelValues, WHITE_PERCENTILE);

  const scale = 255 / (whitePoint - blackPoint);
  const offset = -blackPoint * scale;

  return sharp(input).linear(scale, offset).toBuffer();
}
