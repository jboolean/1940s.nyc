import type * as express from 'express';
import MerchInternalVariant from '../enum/MerchInternalVariant';
import * as MerchCheckoutService from '../business/merch/MerchCheckoutService';
import { PrintCheckoutController } from './PrintCheckoutController';

jest.mock('./auth/userAuthUtils', () => ({
  getUserFromRequestOrCreateAndSetCookie: jest.fn().mockResolvedValue(7),
}));
jest.mock('../business/users/UserService', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 7, email: 'a@b.c' }),
}));
jest.mock('../business/merch/ProductRegistry', () => ({}));
jest.mock('../business/merch/MerchCheckoutService', () => ({
  createMerchCheckoutSession: jest
    .fn()
    .mockResolvedValue({ sessionId: 'cs_1', url: 'http://pay' }),
}));

const urls = { successUrl: 'http://s', cancelUrl: 'http://c' };
const req = {} as express.Request;

describe('PrintCheckoutController.createPrintSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks out a single print', async () => {
    const result = await new PrintCheckoutController().createPrintSession(
      {
        ...urls,
        items: [
          {
            photoIdentifier: 'p1',
            variant: MerchInternalVariant.PRINT_HPR_8X12,
            quantity: 2,
            colorize: true,
          },
        ],
      },
      req
    );

    expect(result).toEqual({ sessionId: 'cs_1', url: 'http://pay' });
    expect(
      MerchCheckoutService.createMerchCheckoutSession
    ).toHaveBeenCalledWith({
      ...urls,
      user: { id: 7, email: 'a@b.c' },
      items: [
        {
          variant: MerchInternalVariant.PRINT_HPR_8X12,
          quantity: 2,
          print: { photoIdentifier: 'p1', colorize: true },
        },
      ],
    });
  });

  it('checks out several prints of different photos in one session', async () => {
    await new PrintCheckoutController().createPrintSession(
      {
        ...urls,
        items: [
          {
            photoIdentifier: 'p1',
            variant: MerchInternalVariant.PRINT_HPR_8X12,
            quantity: 2,
            colorize: true,
          },
          {
            photoIdentifier: 'p2',
            variant: MerchInternalVariant.PRINT_HPR_4X6,
            quantity: 1,
            colorize: false,
          },
        ],
      },
      req
    );

    expect(
      jest.mocked(MerchCheckoutService.createMerchCheckoutSession).mock
        .calls[0][0].items
    ).toEqual([
      {
        variant: MerchInternalVariant.PRINT_HPR_8X12,
        quantity: 2,
        print: { photoIdentifier: 'p1', colorize: true },
      },
      {
        variant: MerchInternalVariant.PRINT_HPR_4X6,
        quantity: 1,
        print: { photoIdentifier: 'p2', colorize: false },
      },
    ]);
  });
});
