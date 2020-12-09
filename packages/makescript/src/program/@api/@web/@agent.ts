import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {AgentService, RunningService} from '../../@services';
import {Config} from '../../config';

export function routeAgent(
  agentService: AgentService,
  runningService: RunningService,
  server: Hapi.Server,
  config: Config,
): void {
  server.route({
    method: 'GET',
    path: '/api/status',
    handler() {
      return {
        joinLink: `${config.api.url}/join/${config.joinToken}`,
        registeredAgents: Array.from(agentService.scriptDefinitionsMap).map(
          ([namespace, definitions]) => {
            return {namespace, scriptQuantity: definitions.length};
          },
        ),
      };
    },
  });

  server.route({
    method: 'GET',
    path: '/api/scripts',
    handler() {
      return {
        definitionsDict: Object.fromEntries(
          agentService.scriptDefinitionsMap.entries(),
        ),
      };
    },
  });

  server.route({
    method: 'POST',
    path: '/api/scripts/update',
    async handler() {
      await agentService.updateScriptsForAllAgents();

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
    method: 'POST',
    path: '/api/records/run',
    async handler(request) {
      let {id} = request.payload as {id: string};

      await runningService.runScript(id);

      return {};
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
