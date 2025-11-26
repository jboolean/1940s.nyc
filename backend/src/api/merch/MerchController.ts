import {
  Body,
  Controller,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
} from '@tsoa/runtime';
import * as express from 'express';
import { BadRequest, NotFound } from 'http-errors';
import { getRepository } from 'typeorm';
import * as MerchOrderService from '../../business/merch/MerchOrderService';
import absurd from '../../business/utils/absurd';
import { getPrintfileUrl } from '../../business/utils/printfileUtils';
import MerchCustomizationOptions from '../../entities/MerchCustomizationOptions';
import MerchOrder from '../../entities/MerchOrder';
import MerchOrderItem from '../../entities/MerchOrderItem';
import MerchItemState from '../../enum/MerchItemState';
import MerchOrderState from '../../enum/MerchOrderState';
import { getUserFromRequestOrCreateAndSetCookie } from '../auth/userAuthUtils';
import { MerchOrderApiModel } from './OrderApiModel';
import { orderToApi } from './orderToApi';

@Route('/merch')
export class MerchController extends Controller {
  private async getAccessibleMerchItem(
    id: number,
    userId: number
  ): Promise<MerchOrderItem> {
    const merchItemRepository = getRepository(MerchOrderItem);
    const item = await merchItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.order', 'order')
      .where({ id })
      .getOne();

    if (!item || item.order.userId !== userId) {
      throw new NotFound('Item not found');
    }
    return item;
  }

  @Put('items/{itemId}/customization-options')
  @Security('user-token')
  public async updateCustomizationOptions(
    @Path('itemId') itemId: number,
    @Body() customizationOptions: MerchCustomizationOptions,
    @Request() req: express.Request
  ): Promise<void> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const item = await this.getAccessibleMerchItem(itemId, userId);

    if (item.state !== MerchItemState.PURCHASED) {
      throw new BadRequest('Item is not in the correct state');
    }

    item.customizationOptions = customizationOptions;
    await getRepository(MerchOrderItem).save(item);
  }

  @Post('items/{itemId}/finalize-customizations')
  @Security('user-token')
  public async finalizeCustomization(
    @Path('itemId') itemId: number,
    @Request() req: express.Request
  ): Promise<void> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const merchItemRepository = getRepository(MerchOrderItem);
    const item = await this.getAccessibleMerchItem(itemId, userId);

    if (item.state !== MerchItemState.PURCHASED) {
      throw new BadRequest('Item is not in the correct state');
    }

    item.state = MerchItemState.CUSTOMIZED;
    await merchItemRepository.save(item);
  }

  @Security('netlify', ['moderator'])
  @Get('items/{itemId}/printfile')
  public async getPrintfile(
    @Path('itemId') itemId: number,
    @Request() req: express.Request
  ): Promise<void> {
    const printfileUrl = await getPrintfileUrl(itemId);

    return req.res?.redirect(302, printfileUrl);
  }

  @Security('netlify', ['moderator'])
  @Patch('orders/{orderId}/state')
  public async updateOrderState(
    @Path('orderId') orderId: number,
    @Body() updates: { state: MerchOrderState }
  ): Promise<MerchOrderApiModel> {
    const { state: newState } = updates;
    const orderRepository = getRepository(MerchOrder);
    let order = await orderRepository.findOneByOrFail({ id: orderId });

    switch (newState) {
      // Submit for fulfillment
      case MerchOrderState.SUBMITTED_FOR_FULFILLMENT:
        switch (order.state) {
          case MerchOrderState.PENDING_SUBMISSION:
            await MerchOrderService.submitOrderForFulfillment(orderId);
            break;
          case MerchOrderState.BUILDING:
          case MerchOrderState.SUBMITTED_FOR_FULFILLMENT:
          case MerchOrderState.CANCELED:
            throw new BadRequest('Invalid state transition');
          default:
            absurd(order.state);
        }
        break;

      // Cancel order
      case MerchOrderState.CANCELED:
        await MerchOrderService.cancelOrder(orderId);
        break;
      default:
        throw new BadRequest('Invalid new state');
    }

    order = await orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.items', 'items')
      .innerJoinAndSelect('order.user', 'user')
      .where({ id: orderId })
      .getOneOrFail();

    return orderToApi(order);
  }

  @Security('user-token')
  @Get('orders')
  public async getMyOrders(
    @Request() req: express.Request
  ): Promise<MerchOrderApiModel[]> {
    const userId = await getUserFromRequestOrCreateAndSetCookie(req);
    const orders = await getRepository(MerchOrder)
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.items', 'items')
      .innerJoinAndSelect('order.user', 'user')
      .where({ userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    return orders.map(orderToApi);
  }

  @Security('netlify', ['moderator'])
  @Get('orders/for-review')
  public async getOrdersForReview(): Promise<MerchOrderApiModel[]> {
    const orders = await MerchOrderService.getOrdersForReview();

    return orders.map(orderToApi);
  }

  @Security('netlify', ['moderator'])
  @Get('orders/needs-attention')
  public async getOrdersNeedingAttention(): Promise<MerchOrderApiModel[]> {
    const orders = await MerchOrderService.getOrdersWithExceptions();

    return orders.map(orderToApi);
  }
}
