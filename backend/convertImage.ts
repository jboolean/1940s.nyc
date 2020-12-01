import sharp from 'sharp';
import AWS from 'aws-sdk';

import * as LaserdiscUtils from './src/image-processing/LaserdiscUtils';

const s3 = new AWS.S3();

type Template = { prefix: string; suffix: string };

const FILENAMES: Record<string, Template> = {
  jpeg: {
    prefix: 'jpg/',
    suffix: '.jpg',
  },
  jpeg420: {
    prefix: '420-jpg/',
    suffix: '.jpg',
  },
};

const makeFilename = (template: Template, rootKey: string): string =>
  template.prefix + rootKey + template.suffix;

const INPUT_PREFIX = 'originals/';

const getRootKey = (srcKey: string): string =>
  srcKey.substring(INPUT_PREFIX.length).replace(/\.\w+$/, '');

export const handler = async (event): Promise<unknown> => {
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = event.Records[0].s3.object.key;

  if (!srcKey.startsWith(INPUT_PREFIX)) {
    console.log('Object does not begin with expected prefix');
    return;
  }

  const rootKey = getRootKey(srcKey);

  const inputObject = await s3
    .getObject({
      Bucket: srcBucket,
      Key: srcKey,
    })
    .promise();

  let inputBuffer = inputObject.Body as Buffer;

  // Crop laserdisc video frames to eliminate borders and superimposed banner
  if (await LaserdiscUtils.isLaserdiscVideoFrame(inputBuffer)) {
    inputBuffer = await LaserdiscUtils.cropVideoFrame(inputBuffer);
  }

  return Promise.all([
    // webp doesn't look that good, sorry webp
    // sharp(inputBuffer)
    //   .webp()
    //   .toBuffer()
    //   .then(outputBuffer =>
    //     s3
    //       .putObject({
    //         Body: outputBuffer,
    //         Bucket: srcBucket,
    //         Key: WEBP_PREFIX + rootKey + '.webp',
    //         ACL: 'public-read',
    //       })
    //       .promise()
    //   ),

    sharp(inputBuffer)
      .jpeg()
      .toBuffer()
      .then((outputBuffer) =>
        s3
          .putObject({
            Body: outputBuffer,
            Bucket: srcBucket,
            Key: makeFilename(FILENAMES.jpeg, rootKey),
            ACL: 'public-read',
            ContentType: 'image/jpeg',
          })
          .promise()
      ),

    sharp(inputBuffer)
      .resize(420, undefined, { withoutEnlargement: true })
      .jpeg()
      .toBuffer()
      .then((outputBuffer) =>
        s3
          .putObject({
            Body: outputBuffer,
            Bucket: srcBucket,
            Key: makeFilename(FILENAMES.jpeg420, rootKey),
            ACL: 'public-read',
            ContentType: 'image/jpeg',
          })
          .promise()
      ),
  ]);
};

export const deletionHandler = async (event): Promise<unknown> => {
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = event.Records[0].s3.object.key;

  if (!srcKey.startsWith(INPUT_PREFIX)) {
    console.log('Object does not begin with expected prefix');
    return;
  }

  const rootKey = getRootKey(srcKey);

  return s3
    .deleteObjects({
      Bucket: srcBucket,
      Delete: {
        Objects: Object.values(FILENAMES)
          .map((template) => makeFilename(template, rootKey))
          .map((key) => ({
            Key: key,
          })),
      },
    })
    .promise();
};
