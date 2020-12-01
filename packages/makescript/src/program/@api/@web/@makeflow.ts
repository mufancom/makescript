import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {MakeflowService} from '../../@services';

export function routeMakeflow(
  makeflowService: MakeflowService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/api/makeflow/list-user-candidates',
    async handler(request) {
      let {username, password} = request.payload as {
        username: string;
        password: string;
      };

      return makeflowService.listUserCandidates(username, password);
    },
    options: {
      validate: {
        payload: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }) as any,
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/api/makeflow/authenticate',
    async handler(request) {
      let {username, password, userId} = request.payload as {
        username: string;
        password: string;
        userId: string;
      };

      await makeflowService.authenticate(username, password, userId);

      return {};
    },
    options: {
      validate: {
        payload: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
          userId: Joi.string(),
        }) as any,
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/api/makeflow/check-authentication',
    handler() {
      return {authenticated: makeflowService.checkAuthentication()};
    },
  });

  server.route({
    method: 'GET',
    path: '/api/makeflow/power-app-definition',
    async handler() {
      return makeflowService.generateAppDefinition();
    },
  });

  server.route({
    method: 'POST',
    path: '/api/makeflow/publish',
    async handler() {
      await makeflowService.publishPowerApp();

      return {};
    },
  });
}
