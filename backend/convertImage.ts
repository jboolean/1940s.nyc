import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import sharp from 'sharp';

import * as ImageAdjustUtils from './src/image-processing/ImageAdjustUtils';
import * as LaserdiscUtils from './src/image-processing/LaserdiscUtils';

const s3 = new S3Client();

type Template = { prefix: string; suffix: string };

const FILENAMES: Record<string, Template> = {
  jpeg: {
    prefix: 'jpg/',
    suffix: '.jpg',
  },
  jpeg720: {
    prefix: '720-jpg/',
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

export const handler = async (event: S3Event): Promise<unknown> => {
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = event.Records[0].s3.object.key;

  if (!srcKey.startsWith(INPUT_PREFIX)) {
    console.log('Object does not begin with expected prefix');
    return;
  }

  const rootKey = getRootKey(srcKey);

  const inputObject = await s3.send(
    new GetObjectCommand({
      Bucket: srcBucket,
      Key: srcKey,
    })
  );

  if (!inputObject.Body) {
    throw new Error('Source object not found');
  }

  let inputBuffer: Buffer = Buffer.from(
    await inputObject.Body.transformToByteArray()
  );

  // Crop laserdisc video frames to eliminate borders and superimposed banner
  if (await LaserdiscUtils.isLaserdiscVideoFrame(inputBuffer)) {
    inputBuffer = await LaserdiscUtils.cropVideoFrame(inputBuffer);
  }

  // Perform level normalization
  inputBuffer = await ImageAdjustUtils.adjustLevels(inputBuffer);

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
      .jpeg({
        progressive: true,
      })
      .toBuffer()
      .then((outputBuffer) =>
        s3.send(
          new PutObjectCommand({
            Body: outputBuffer,
            Bucket: srcBucket,
            Key: makeFilename(FILENAMES.jpeg, rootKey),
            ACL: 'public-read',
            ContentType: 'image/jpeg',
          })
        )
      ),

    sharp(inputBuffer)
      .resize(720, undefined, { withoutEnlargement: true })
      .jpeg({
        progressive: true,
        quality: 95,
      })
      .toBuffer()
      .then((outputBuffer) =>
        s3.send(
          new PutObjectCommand({
            Body: outputBuffer,
            Bucket: srcBucket,
            Key: makeFilename(FILENAMES.jpeg720, rootKey),
            ACL: 'public-read',
            ContentType: 'image/jpeg',
          })
        )
      ),

    sharp(inputBuffer)
      .resize(420, undefined, { withoutEnlargement: true })
      .jpeg({
        progressive: true,
      })
      .toBuffer()
      .then((outputBuffer) =>
        s3.send(
          new PutObjectCommand({
            Body: outputBuffer,
            Bucket: srcBucket,
            Key: makeFilename(FILENAMES.jpeg420, rootKey),
            ACL: 'public-read',
            ContentType: 'image/jpeg',
          })
        )
      ),
  ]);
};

export const deletionHandler = async (event: S3Event): Promise<unknown> => {
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = event.Records[0].s3.object.key;

  if (!srcKey.startsWith(INPUT_PREFIX)) {
    console.log('Object does not begin with expected prefix');
    return;
  }

  const rootKey = getRootKey(srcKey);

  return s3.send(
    new DeleteObjectsCommand({
      Bucket: srcBucket,
      Delete: {
        Objects: Object.values(FILENAMES)
          .map((template) => makeFilename(template, rootKey))
          .map((key) => ({
            Key: key,
          })),
      },
    })
  );
};
