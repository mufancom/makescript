import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {RunningService, ScriptService} from '../../@services';

export function routeScripts(
  scriptService: ScriptService,
  runningService: RunningService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'GET',
    path: '/api/scripts',
    handler() {
      return {definition: scriptService.scriptsDefinition};
    },
  });

  server.route({
    method: 'POST',
    path: '/api/scripts/update',
    async handler() {
      await scriptService.updateScripts();

      return {};
    },
  });

  server.route({
    method: 'GET',
    path: '/api/scripts/running-records',
    handler() {
      return {records: runningService.runningRecords};
    },
  });

  server.route({
    method: 'GET',
    path: '/api/scripts/repo-url',
    handler() {
      console.log('aaaa: ', scriptService.scriptsRepoURL);
      return {url: scriptService.scriptsRepoURL};
    },
  });

  server.route({
    method: 'POST',
    path: '/api/scripts/repo-url/update',
    async handler(request) {
      let {url} = request.payload as {url: string};

      await scriptService.updateScriptsRepoURL(url);

      return {};
    },
    options: {
      validate: {
        payload: Joi.object({
          url: Joi.string(),
        }) as any,
      },
    },
  });
}
