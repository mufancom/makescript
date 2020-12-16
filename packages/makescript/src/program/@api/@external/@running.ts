import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import type {Dict} from 'tslang';

import {RunningService} from '../../@services';

export function routeRunning(
  runningService: RunningService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/api/script/{namespace}/{name}/enqueue',
    async handler(request) {
      let {namespace, name} = request.params;

      let {parameters} = request.payload as {
        parameters: Dict<unknown>;
      };

      // TODO: Add auth
      let tokenLabel = request.auth.credentials.tokenLabel as string;

      await runningService.enqueueRunningRecord({
        namespace,
        name,
        parameters,
        triggerTokenLabel: tokenLabel,
        makeflowTask: undefined,
      });
    },
    options: {
      validate: {
        payload: Joi.object({
          parameters: Joi.object(),
        }) as any,
      },
    },
  });
}
