import sharp from 'sharp';

type SharpInput = Parameters<typeof sharp>[0];

const BANNER_START_Y = 353;
const PORTRAIT_START_X = 210;
const PORTRAIT_START_Y = 40;
const PORTRAIT_WIDTH = 220;

const PORTRAIT_THRESHOLD = 25;

export default async function isLaserdiscVideoFrame(
  input: SharpInput
): Promise<boolean> {
  const meta = await sharp(input).metadata();

  return (
    meta.chromaSubsampling === '4:2:0' &&
    meta.width === 640 &&
    meta.height === 480
  );
}

async function isPortrait(input: SharpInput): Promise<boolean> {
  // Examines the left side of the image to see if it's dark

  // Must commit to buffer before stats
  const leftSide = await sharp(input)
    .extract({
      left: 0,
      top: 0,
      height: BANNER_START_Y,
      width: PORTRAIT_START_X,
    })
    .toBuffer();

  const leftSideStats = await sharp(leftSide).stats();

  const meanOfMeans =
    leftSideStats.channels
      .map((channel) => channel.mean)
      .reduce((acc, cur) => acc + cur) / leftSideStats.channels.length;

  return meanOfMeans < PORTRAIT_THRESHOLD;
}

export async function cropVideoFrame(input: SharpInput): Promise<Buffer> {
  let sharpForOutput = sharp(input);

  const portrait = await isPortrait(input);

  // Crop out the banner and in portrait, the sides and top.
  sharpForOutput = sharpForOutput.extract(
    portrait
      ? {
          left: PORTRAIT_START_X,
          top: PORTRAIT_START_Y,
          height: BANNER_START_Y - PORTRAIT_START_Y,
          width: PORTRAIT_WIDTH,
        }
      : { left: 0, top: 0, width: 640, height: BANNER_START_Y }
  );

  // Apply light trim on portrait photos to cut down borders as the crop is imperfect
  if (portrait) {
    sharpForOutput = sharp(await sharpForOutput.toBuffer()).trim(20);
  }

  return sharpForOutput.toBuffer();
}
