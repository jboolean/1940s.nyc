import * as express from 'express';
import { Controller, Get, Path, Request, Route, Security } from 'tsoa';
import * as ColorService from '../business/color/ColorService';
import { getUserFromRequestOrCreateAndSetCookie } from './auth/userAuthUtils';

@Route('colorization')
export class ColorizationController extends Controller {
  @Security('user-token')
  @Get('/colorized/{identifier}')
  public async getColorizedImage(
    @Path('identifier') identifier: string,
    @Request() req: express.Request
  ): Promise<void> {
    const res = req.res;
    if (!res) {
      throw new Error('No response object');
    }

    const userId = await getUserFromRequestOrCreateAndSetCookie(req, res);

    const url = await ColorService.getColorizedImage(identifier, userId);
    res.redirect(301, url);
  }
}
