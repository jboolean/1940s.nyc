import * as fs from 'fs';
import path from 'path';
import 'reflect-metadata';
import { Connection, createConnection, getConnectionManager } from 'typeorm';
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

export default function createConnectionIfNotExists(): Promise<Connection> {
  // Validate metadata in development/debug mode
  if (process.env.IS_OFFLINE || process.env.NODE_ENV !== 'production') {
    validateEntityMetadata();
  }

  const connectionManager = getConnectionManager();
  if (connectionManager.has('default')) {
    const connection = connectionManager.get('default');
    if (!connection.isConnected) {
      return connection.connect();
    }
    return Promise.resolve(connection);
  }

  const sslCert = fs.readFileSync(
    path.join(process.cwd(), 'certs/us-east-1-bundle.pem')
  );

  const {
    DB_HOST: host,
    DB_PORT: port,
    DB_USERNAME: username,
    DB_PASSWORD: password,
    DB_DATABASE: database,
  } = process.env;

  return createConnection({
    type: 'postgres',
    host,
    port: Number(port),
    username,
    password,
    database,
    ssl: {
      rejectUnauthorized: true,
      ca: sslCert.toString(),
    },
    synchronize: false,
    logging: !!process.env.IS_OFFLINE,
    entities: ENTITIES,
    namingStrategy: new SnakeNamingStrategy(),
  });
}
