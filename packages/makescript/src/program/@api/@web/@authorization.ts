import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import type {Dict} from 'tslang';

import {AppService} from '../../@services';

export function routeAuthorization(
  appService: AppService,
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
      let {password} = request.payload as {
        password: string;
      };

      let passwordCorrect = appService.validatePassword(password);

      if (!passwordCorrect) {
        return h.redirect('/login');
      }

      request.cookieAuth.set({authed: true});

      return h.redirect('/home');
    },
    options: {
      auth: {
        mode: 'try',
      },
      validate: {
        payload: (Joi.object({
          password: Joi.string().optional(),
        }) as unknown) as Dict<any>,
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/api/initialize',
    async handler(request, h) {
      let {password} = request.payload as {
        password: string;
      };

      await appService.initialize(password);

      request.cookieAuth.set({authed: true});

      return h.redirect('/home');
    },
    options: {
      auth: {
        mode: 'try',
      },
      validate: {
        payload: (Joi.object({
          password: Joi.string().optional(),
        }) as unknown) as Dict<any>,
      },
    },
  });
}
