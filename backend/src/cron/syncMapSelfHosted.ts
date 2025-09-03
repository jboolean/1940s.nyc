import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { getRepository } from 'typeorm';
import GeojsonEncoder from '../business/geodata/GeojsonEncoder';
import tippecanoe from '../business/utils/tippecanoe';
import EffectiveAddress from '../entities/EffectiveAddress';
import EffectiveGeocode from '../entities/EffectiveGeocode';

const s3 = new S3Client();
const cloudFront = new CloudFrontClient();

export default async function syncMap(): Promise<void> {
  console.log('Refreshing effective addresses...');
  await getRepository(EffectiveAddress).query(
    'REFRESH MATERIALIZED VIEW effective_addresses_view WITH DATA'
  );

  console.log('Refreshing effective geocodes...');
  await getRepository(EffectiveGeocode).query(
    'REFRESH MATERIALIZED VIEW effective_geocodes_view WITH DATA'
  );

  const encoder = new GeojsonEncoder('newline-delimited-geojson');

  console.log('Beginning sync of map data...');

  const dataStream = await encoder.createGeojson('1940');

  console.log('Generating PMTiles file...');
  // eslint-disable-next-line prettier/prettier
  await using result = await tippecanoe(dataStream, {
    layer: 'photos-1940s',
    dropDensestAsNeeded: true,
    extendZoomsIfStillDropping: true,
  });

  console.log('Uploading PMTiles to S3...');
  const pmtilesStream = createReadStream(result.outputPath);
  
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-maps',
      Key: 'photos-1940s.pmtiles',
      Body: pmtilesStream,
      ContentType: 'application/vnd.pmtiles',
      CacheControl: 'max-age=86400',
    })
  );

  console.log('Creating CloudFront invalidation...');
  const distributionId = process.env.MAPTILES_CLOUDFRONT_DISTRIBUTION_ID;
  if (distributionId) {
    await cloudFront.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/photos-1940s.pmtiles'],
          },
          CallerReference: `sync-map-${Date.now()}`,
        },
      })
    );
    console.log('CloudFront invalidation created successfully.');
  } else {
    console.log('MAPTILES_CLOUDFRONT_DISTRIBUTION_ID not set, skipping invalidation.');
  }

  console.log('Sync of map data complete.');
}
