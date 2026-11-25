import sharp from 'sharp';
import applyColorToOriginal from './applyColorToOriginal';

async function labAt(image: Buffer, x: number, y: number): Promise<number[]> {
  const { data } = await sharp(image)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .toColourspace('lab')
    .raw({ depth: 'float' })
    .toBuffer({ resolveWithObject: true });
  return Array.from(new Float32Array(data.buffer, data.byteOffset, 3));
}

describe('applyColorToOriginal', () => {
  it.each([
    { colorizedWidth: 20, colorizedHeight: 10, outputScale: 1 },
    { colorizedWidth: 400, colorizedHeight: 200, outputScale: 2 },
  ])(
    'takes lightness from the original and colour from a $colorizedWidth px colorized image',
    async ({ colorizedWidth, colorizedHeight, outputScale }) => {
      const width = 200;
      const height = 100;
      const pixels = Buffer.alloc(width * height);
      for (let y = 0; y < height; y++) {
        pixels.fill(60, y * width, y * width + width / 2);
        pixels.fill(190, y * width + width / 2, (y + 1) * width);
      }
      const original = await sharp(pixels, {
        raw: { width, height, channels: 1 },
      })
        .toColourspace('b-w')
        .png()
        .toBuffer();
      const colorized = await sharp({
        create: {
          width: colorizedWidth,
          height: colorizedHeight,
          channels: 3,
          background: { r: 160, g: 90, b: 80 },
        },
      })
        .png()
        .toBuffer();

      const result = await applyColorToOriginal(original, colorized);

      const metadata = await sharp(result).metadata();
      expect([metadata.width, metadata.height]).toEqual([
        width * outputScale,
        height * outputScale,
      ]);
      for (const x of [20, 180]) {
        const [originalLightness] = await labAt(original, x, 50);
        const [lightness, a] = await labAt(
          result,
          x * outputScale,
          50 * outputScale
        );
        expect(lightness).toBeCloseTo(originalLightness, 0);
        expect(a).toBeGreaterThan(10);
      }
    }
  );
});
