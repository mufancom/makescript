import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import {Dict} from 'tslang';

import {RunningService} from '../@services';

export function routeRunning(
  runningService: RunningService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/running/run',
    async handler(request) {
      let payload = request.payload as Dict<any>;

      return runningService.runScript({
        token: payload.token,
        name: payload.name,
        parameters: payload.parameters,
        resourcesBaseURL: payload.resourcesBaseURL,
        hostURL: payload.hostURL,
      });
    },
    options: {
      validate: {
        // The types of Hapi and Joi are not uniform, so need to do as.
        payload: (Joi.object({
          token: Joi.string(),
          name: Joi.string(),
          parameters: Joi.array().items(
            Joi.object({
              name: Joi.string(),
              value: Joi.any(),
            }),
          ),
          resourcesBaseURL: Joi.string(),
          hostURL: Joi.string(),
        }) as unknown) as Dict<any>,
      },
    },
  });
}
