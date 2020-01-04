import serverlessHttp from 'serverless-http';
import app from './src/app';
import 'source-map-support/register'

export const handler = serverlessHttp(app);