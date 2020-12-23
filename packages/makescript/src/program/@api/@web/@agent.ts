import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {AgentService, RunningService} from '../../@services';
import {Config} from '../../config';

export function routeAgent(
  agentService: AgentService,
  runningService: RunningService,
  config: Config,
  server: Hapi.Server,
): void {
  server.route({
    method: 'GET',
    path: '/api/status',
    async handler() {
      let scriptDefinitionsMap = await agentService.getScriptDefinitionsMap();

      return {
        url: config.url,
        joinLink: agentService.joinLink,
        registeredAgents: Array.from(scriptDefinitionsMap).map(
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
    async handler() {
      let scriptDefinitionsMap = await agentService.getScriptDefinitionsMap();

      return {
        url: config.url,
        definitionsDict: Object.fromEntries(scriptDefinitionsMap.entries()),
      };
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
      let {id, password} = request.payload as {
        id: string;
        password: string | undefined;
      };

      await runningService.runScript(id, password);

      return {};
    },
    options: {
      validate: {
        payload: Joi.object({
          id: Joi.string(),
          password: Joi.string().optional(),
        }) as any,
      },
    },
  });
}
