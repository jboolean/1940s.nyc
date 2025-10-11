import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { getRepository } from 'typeorm';
import GeojsonEncoder from '../business/geodata/GeojsonEncoder';
import tippecanoe from '../business/utils/tippecanoe';
import EffectiveAddress from '../entities/EffectiveAddress';
import EffectiveGeocode from '../entities/EffectiveGeocode';

const s3 = new S3Client();

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

  const key = `photos-1940s_${Date.now()}.pmtiles`;
  
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-maps',
      Key: key,
      Body: pmtilesStream,
      ContentType: 'application/vnd.pmtiles',
      CacheControl: 'max-age=86400',
    })
  );

   await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-maps',
      Key: `photos-1940s_latest.pmtiles`,
      WebsiteRedirectLocation: `/${key}`,
      Body: undefined,
      ContentType: 'application/vnd.pmtiles',
      CacheControl: 'no-cache'
    })
  );

  // Save a version file that points to the latest PMTiles file
  const versionFileContent = JSON.stringify({
    currentKey: key,
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: 'fourties-maps',
      Key: 'photos-1940s_version.json',
      Body: versionFileContent,
      ContentType: 'application/json',
      CacheControl: 'no-cache',
    })
  );

  // Cleanup pmtiles older than 7 days
  console.log('Cleaning up old PMTiles files...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const listCommand = new ListObjectsV2Command({
    Bucket: 'fourties-maps',
    Prefix: 'photos-1940s_',
  });
  const listResponse = await s3.send(listCommand);
  if (listResponse.Contents) {
    for (const item of listResponse.Contents) {
      if (item.Key && item.Key.endsWith('.pmtiles') && item.LastModified && item.LastModified < sevenDaysAgo) {
        console.log(`Deleting old PMTiles file: ${item.Key}`);
        const deleteCommand = new DeleteObjectCommand({
          Bucket: 'fourties-maps',
          Key: item.Key,
        });
        await s3.send(deleteCommand);
      }
    }
  }

  console.log('Sync of map data complete.');
}
