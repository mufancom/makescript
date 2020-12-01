import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import type {Dict} from 'tslang';

import {MakeflowService} from '../../@services';

export function routeMakeflow(
  makeflowService: MakeflowService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/api/makeflow/power-item/{item}/action/{action}',
    async handler(request) {
      let actionName = request.params.action as string;

      let {
        token: powerItemToken,
        configs: {token: accessToken},
        inputs,
      } = request.payload as {
        token: string;
        configs: {token: string};
        inputs: Dict<unknown>;
      };

      await makeflowService.triggerAction(
        actionName,
        powerItemToken,
        inputs,
        accessToken,
      );
    },
    options: {
      validate: {
        payload: Joi.object({
          token: Joi.string(),
          configs: Joi.object({
            token: Joi.string(),
          }),
          inputs: Joi.object().optional(),
        }) as any,
      },
    },
  });

  // To fit power item related api
  server.route({
    method: 'POST',
    path: '/api/makeflow/power-item/{item}/{action}',
    handler() {
      return {};
    },
  });

  // To fit app installation related api
  server.route({
    method: 'POST',
    path: '/api/makeflow/installation/{action}',
    handler() {
      return {};
    },
  });
}
