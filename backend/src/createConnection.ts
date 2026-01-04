import * as fs from 'fs';
import path from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Import all entities directly for webpack compatibility
import AddressCorrection from './entities/AddressCorrection';
import CampaignSend from './entities/CampaignSend';
import EffectiveAddress from './entities/EffectiveAddress';
import EffectiveGeocode from './entities/EffectiveGeocode';
import GeocodeCorrection from './entities/GeocodeCorrection';
import GeocodeResult from './entities/GeocodeResult';
import LedgerEntry from './entities/LedgerEntry';
import MailingListMember from './entities/MailingListMember';

import MerchOrder from './entities/MerchOrder';
import MerchOrderItem from './entities/MerchOrderItem';
import Photo from './entities/Photo';

import Story from './entities/Story';
import User from './entities/User';

// DB connection related env vars
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;
// Force entity class metadata to be evaluated
const ENTITIES = [
  AddressCorrection,
  CampaignSend,
  EffectiveAddress,
  EffectiveGeocode,
  GeocodeCorrection,
  GeocodeResult,
  LedgerEntry,
  MailingListMember,
  MerchOrder,
  MerchOrderItem,
  Photo,
  Story,
  User,
];
// Validate metadata exists for all entities
function validateEntityMetadata(): void {
  for (const entity of ENTITIES) {
    const metadata: unknown = Reflect.getMetadata(
      'design:type',
      entity.prototype,
      'id'
    );
    if (!metadata) {
      console.error(`Missing metadata for entity: ${entity.name}`);
    }
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  ssl: {
    rejectUnauthorized: true,
    ca: fs
      .readFileSync(path.join(process.cwd(), 'certs/us-east-1-bundle.pem'))
      .toString(),
  },
  synchronize: false,
  logging: !!process.env.IS_OFFLINE,
  entities: ENTITIES,
  namingStrategy: new SnakeNamingStrategy(),
});

export default async function createConnectionIfNotExists(): Promise<DataSource> {
  // Validate metadata in development/debug mode
  if (process.env.IS_OFFLINE || process.env.NODE_ENV !== 'production') {
    validateEntityMetadata();
  }
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
