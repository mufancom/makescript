import Cookie from '@hapi/cookie';
import Hapi from '@hapi/hapi';
import type {Dict} from 'tslang';

import {AppService} from '../../@services';

export const COOKIE_NAME = 'makescript';
export const COOKIE_PASSWORD = 'makescript-cookie-password-secret';

export const SESSION_AUTH_STRATEGY = 'session';

export async function setupAuth(
  appService: AppService,
  server: Hapi.Server,
): Promise<void> {
  await server.register(Cookie);

  server.auth.strategy(SESSION_AUTH_STRATEGY, 'cookie', {
    cookie: {
      name: COOKIE_NAME,
      password: COOKIE_PASSWORD,
      isSecure: false,
    },
    redirectTo: () => (appService.initialized ? '/login' : '/initialize'),
    validateFunc: async (_, session) => {
      if (appService.noAuthRequired || (session as Dict<unknown>).authed) {
        return {valid: true};
      }

      return {valid: false};
    },
  });

  server.auth.default(SESSION_AUTH_STRATEGY);
}
