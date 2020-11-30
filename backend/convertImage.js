const sharp = require('sharp');
const AWS = require('aws-sdk');

const LaserdiscUtils = require('./src/image-processing/LaserdiscUtils');

const s3 = new AWS.S3();

const FILENAMES = {
  jpeg: {
    prefix: 'jpg/',
    suffix: '.jpg',
  },
  jpeg420: {
    prefix: '420-jpg/',
    suffix: '.jpg',
  },
};

const makeFilename = (template, rootKey) =>
  template.prefix + rootKey + template.suffix;

const INPUT_PREFIX = 'originals/';

const getRootKey = (srcKey) =>
  srcKey.substring(INPUT_PREFIX.length).replace(/\.\w+$/, '');

module.exports.handler = async (event) => {
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

  let inputBuffer = inputObject.Body;

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
      .resize(420)
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

module.exports.deletionHandler = async (event) => {
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
