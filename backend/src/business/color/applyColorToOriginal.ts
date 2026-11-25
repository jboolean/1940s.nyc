import sharp from 'sharp';

// CIE Lab D65 white point and XYZ-to-linear-sRGB matrix, matching libvips.
const WHITE_X = 0.95047;
const WHITE_Z = 1.088827;
const EPSILON = 6 / 29;

function labToXyzComponent(t: number): number {
  return t > EPSILON ? t * t * t : 3 * EPSILON * EPSILON * (t - 4 / 29);
}

function linearToSrgb8(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

function asFloats(buffer: Buffer): Float32Array {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

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

  const { data: lightnessData, info } = await sharp(original)
    .rotate()
    .resize(
      Math.round(originalSize.width * scale),
      Math.round(originalSize.height * scale),
      { fit: 'fill' }
    )
    .toColourspace('lab')
    .raw({ depth: 'float' })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const { data: colorData } = await sharp(colorized)
    .rotate()
    .removeAlpha()
    .resize(width, height, { fit: 'fill' })
    .toColourspace('lab')
    .raw({ depth: 'float' })
    .toBuffer({ resolveWithObject: true });

  const lightness = asFloats(lightnessData);
  const color = asFloats(colorData);
  const lightnessChannels = info.channels;
  const rgb = Buffer.alloc(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    const l = lightness[i * lightnessChannels];
    const a = color[i * 3 + 1];
    const b = color[i * 3 + 2];

    const fy = (l + 16) / 116;
    const x = WHITE_X * labToXyzComponent(fy + a / 500);
    const y = labToXyzComponent(fy);
    const z = WHITE_Z * labToXyzComponent(fy - b / 200);

    rgb[i * 3] = linearToSrgb8(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
    rgb[i * 3 + 1] = linearToSrgb8(
      -0.969266 * x + 1.8760108 * y + 0.041556 * z
    );
    rgb[i * 3 + 2] = linearToSrgb8(
      0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    );
  }

  return sharp(rgb, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
}
