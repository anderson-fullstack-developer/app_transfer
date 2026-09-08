import { type CookieOptions, type Response } from 'express';
import { type AppConfigService } from '../config/app-config.service';

export const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function baseOptions(config: AppConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    domain: config.cookie.domain || undefined,
  };
}

export function setRefreshCookie(
  res: Response,
  config: AppConfigService,
  rawToken: string,
  expiresAt: Date,
): void {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, { ...baseOptions(config), expires: expiresAt });
}

export function clearRefreshCookie(res: Response, config: AppConfigService): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions(config));
}
