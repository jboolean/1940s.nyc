import {
  createClientConfig,
  getAuthorizationHeader,
  getWhccBaseUrl,
} from './createClientConfig';
import { createClientConfig as createFulfillmentClientConfig } from './createFulfillmentClientConfig';

afterEach(() => {
  delete process.env.WHCC_SK;
});

it('builds a bearer header from the key', () => {
  process.env.WHCC_SK = 'key';
  expect(getAuthorizationHeader()).toBe('Bearer key');
});

it('throws when the key is empty', () => {
  process.env.WHCC_SK = '';
  expect(() => getAuthorizationHeader()).toThrow('WHCC_SK');
});

describe('host selection', () => {
  const originalStage = process.env.STAGE;

  afterEach(() => {
    if (originalStage === undefined) {
      delete process.env.STAGE;
    } else {
      process.env.STAGE = originalStage;
    }
  });

  it('uses the live host in production', () => {
    process.env.STAGE = 'production';
    expect(getWhccBaseUrl()).toBe('https://apis.whcc.com/api');
    expect(createClientConfig({}).baseURL).toBe('https://apis.whcc.com/api');
    expect(createFulfillmentClientConfig({}).baseURL).toBe(
      'https://apis.whcc.com'
    );
  });

  it.each(['staging', 'dev'])(
    'uses the sandbox host when the stage is %s',
    (stage) => {
      process.env.STAGE = stage;
      expect(getWhccBaseUrl()).toBe('https://apis-stage.whcc.com/api');
      expect(createClientConfig({}).baseURL).toBe(
        'https://apis-stage.whcc.com/api'
      );
      expect(createFulfillmentClientConfig({}).baseURL).toBe(
        'https://apis-stage.whcc.com'
      );
    }
  );
});
