import * as fs from 'fs';
import path from 'path';
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

export default function createConnectionIfNotExists(): Promise<Connection> {
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
    entities: [
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
    ],
    namingStrategy: new SnakeNamingStrategy(),
  });
}
