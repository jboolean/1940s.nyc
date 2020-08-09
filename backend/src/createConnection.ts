import { createConnection, Connection, getConnectionManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export default function createConnectionIfNotExists(): Promise<Connection> {
  const connectionManager = getConnectionManager();
  if (connectionManager.has('default')) {
    const connection = connectionManager.get('default');
    if (!connection.isConnected) {
      console.log('Has connection, not connected.');
      return connection.connect();
    }
    console.log('Already connected');
    return Promise.resolve(connection);
  }

  const {
    DB_HOST: host,
    DB_PORT: port,
    DB_USERNAME: username,
    DB_PASSWORD: password,
    DB_DATABASE: database,
  } = process.env;

  console.log('Creating new connection');
  return createConnection({
    type: 'postgres',
    host,
    port: Number(port),
    username,
    password,
    database,
    synchronize: false,
    logging: !!process.env.IS_OFFLINE,
    entities: [__dirname + '/entities/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
  });
}
