import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import type {Dict} from 'tslang';

import {UserService} from '../../@services';

export function routeAuthorization(
  userService: UserService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'GET',
    path: '/api/check',
    handler() {
      return {};
    },
  });

  server.route({
    method: 'POST',
    path: '/api/login',
    handler(request, h) {
      let {username, password} = request.payload as {
        username: string;
        password: string;
      };

      let user = userService.validateUser(username, password);

      if (!user) {
        return h.redirect('/login');
      }

      request.cookieAuth.set({userId: user.id});

      return h.redirect('/home');
    },
    options: {
      auth: {
        mode: 'try',
      },
      validate: {
        payload: (Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }) as unknown) as Dict<any>,
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/api/initialize',
    async handler(request, h) {
      let {username, password} = request.payload as {
        username: string;
        password: string;
      };

      let user = await userService.initializeAdminUser({
        username,
        password,
        notificationHook: undefined,
      });

      if (!user) {
        return h.redirect('/login');
      }

      request.cookieAuth.set({userId: user.id});

      return h.redirect('/home');
    },
    options: {
      auth: {
        mode: 'try',
      },
      validate: {
        payload: (Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }) as unknown) as Dict<any>,
      },
    },
  });
}
