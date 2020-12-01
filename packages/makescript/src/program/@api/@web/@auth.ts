import Cookie from '@hapi/cookie';
import Hapi from '@hapi/hapi';
import type {Dict} from 'tslang';

import {UserService} from '../../@services';

export const COOKIE_NAME = 'makescript';
export const COOKIE_PASSWORD = 'makescript-cookie-password-secret';

export const SESSION_AUTH_STRATEGY = 'session';

export async function setupAuth(
  userService: UserService,
  server: Hapi.Server,
): Promise<void> {
  await server.register(Cookie);

  server.auth.strategy(SESSION_AUTH_STRATEGY, 'cookie', {
    cookie: {
      name: COOKIE_NAME,
      password: COOKIE_PASSWORD,
      isSecure: false,
    },
    redirectTo: () => (userService.hasAnyUser ? '/login' : '/initialize'),
    validateFunc: async (_, session) => {
      let authedUser = userService.getUserById(
        (session as Dict<string>)?.userId,
      );

      if (!authedUser) {
        return {valid: false};
      }

      return {valid: true, credentials: authedUser};
    },
  });

  server.auth.default(SESSION_AUTH_STRATEGY);
}
