import 'reflect-metadata';
import serverlessHttp from 'serverless-http';
import 'source-map-support/register';
import app from './src/app';

export const handler = serverlessHttp(app);
