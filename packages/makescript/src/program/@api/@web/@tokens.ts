import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {TokenService} from '../../@services';

export function routeTokens(
  tokenService: TokenService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/api/token/generate',
    async handler(request) {
      let {label} = request.payload as {label: string};

      return {token: await tokenService.generateToken(label)};
    },
    options: {
      validate: {
        payload: Joi.object({
          label: Joi.string(),
        }) as any,
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/api/tokens',
    handler() {
      return {tokens: tokenService.getActiveTokens()};
    },
  });

  server.route({
    method: 'POST',
    path: '/api/token/disable',
    async handler(request) {
      let {id} = request.payload as {id: string};

      await tokenService.disableToken(id);
    },
    options: {
      validate: {
        payload: Joi.object({
          id: Joi.string(),
        }) as any,
      },
    },
  });
}
