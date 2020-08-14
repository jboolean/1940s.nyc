/* eslint-disable @typescript-eslint/no-var-requires */
const sharp = require('sharp');
const axios = require('axios');
const EXT_PATTERN = /\.(\w+)$/;

module.exports.handler = async event => {
  const request = event.Records[0].cf.request;
  const origin = request.origin.custom;
  const ext = request.uri.match(EXT_PATTERN)[1];

  const imageUrl = `${origin.protocol}://${origin.domainName}${
    origin.path
  }${request.uri.replace(EXT_PATTERN, '.png')}`;
  console.log(imageUrl);

  try {
    const resp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);

    let compressed = buffer;
    let contentType = 'image/png';

    if (ext === 'jpg') {
      compressed = await sharp(buffer)
        .jpeg({ quality: 50, progressive: true })
        .toBuffer();
      contentType = 'image/jpeg';
    } else if (ext === 'webp') {
      compressed = await sharp(buffer)
        .webp({ quality: 50 })
        .toBuffer();
      contentType = 'image/webp';
    }

    return {
      body: compressed.toString('base64'),
      bodyEncoding: 'base64',
      headers: {
        'content-type': [
          {
            key: 'Content-Type',
            value: contentType,
          },
        ],
        'access-control-allow-origin': [{
          key: 'Access-Control-Allow-Origin',
          value: '*'
        }]
      },
      status: '200',
      statusDescription: 'Recompressed',
    };
  } catch (err) {
    const resp = err.response;
    console.warn(err);
    return {
      body: resp.body,
      bodyEncoding: 'text',
      headers: {},
      status: resp.status,
      statusDescription: err.message,
    };
  }
};
