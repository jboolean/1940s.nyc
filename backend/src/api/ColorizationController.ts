import { Controller, Get, Path, Request, Route } from 'tsoa';
import * as ColorService from '../business/color/ColorService';
import * as express from 'express';

@Route('colorization')
export class ColorizationController extends Controller {
  @Get('/colorized/{identifier}')
  public async getColorizedImage(
    @Path('identifier') identifier: string,
    @Request() req: express.Request
  ): Promise<void> {
    const res = req.res;
    if (!res) {
      throw new Error('No response object');
    }

    const url = await ColorService.getColorizedImage(identifier);
    res.redirect(301, url);
  }
}
