import sharp from 'sharp';

const LIGHTNESS = 0;
const GREEN_RED = 1;
const BLUE_YELLOW = 2;
export const JPEG_QUALITY = 95;

/**
 * Lays the colour of `colorized` over `original`: lightness comes from the original, hue and chroma
 * from the colorized image. The result keeps the original's aspect ratio at whichever of the two is
 * wider.
 */
export default async function applyColorToOriginal(
  original: Buffer,
  colorized: Buffer
): Promise<Buffer> {
  const { autoOrient: originalSize } = await sharp(original).metadata();
  const { autoOrient: colorizedSize } = await sharp(colorized).metadata();
  const scale = Math.max(1, colorizedSize.width / originalSize.width);
  const width = Math.round(originalSize.width * scale);
  const height = Math.round(originalSize.height * scale);

  const labChannel = async (
    image: Buffer,
    channel: typeof LIGHTNESS | typeof GREEN_RED | typeof BLUE_YELLOW
  ): Promise<Float32Array> => {
    const data = await sharp(image)
      .autoOrient()
      .resize(width, height, { fit: 'fill' })
      .toColourspace('lab')
      .extractChannel(channel)
      .raw({ depth: 'float' })
      .toBuffer();
    return new Float32Array(
      data.buffer,
      data.byteOffset,
      data.length / Float32Array.BYTES_PER_ELEMENT
    );
  };

  const [lightness, greenRed, blueYellow] = await Promise.all([
    labChannel(original, LIGHTNESS),
    labChannel(colorized, GREEN_RED),
    labChannel(colorized, BLUE_YELLOW),
  ]);

  // Joined channels take on the output colourspace, so the bands are read as Lab. sharp's
  // types only allow Buffers here, but like its constructor it takes float arrays as raw input.
  const raw = { raw: { width, height, channels: 1 } } as const;
  return sharp(lightness, raw)
    .joinChannel([greenRed, blueYellow] as unknown as Buffer[], raw)
    .toColourspace('lab')
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
