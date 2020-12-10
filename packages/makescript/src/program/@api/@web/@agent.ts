import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';

import {AgentService, RecordService, RunningService} from '../../@services';
import {Config} from '../../config';

export function routeAgent(
  agentService: AgentService,
  runningService: RunningService,
  recordService: RecordService,
  server: Hapi.Server,
  config: Config,
): void {
  server.route({
    method: 'GET',
    path: '/api/status',
    async handler() {
      let scriptDefinitionsMap = await agentService.getScriptDefinitionsMap();

      return {
        joinLink: `${config.api.url}/join/${config.joinToken}`,
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
        definitionsDict: Object.fromEntries(scriptDefinitionsMap.entries()),
      };
    },
  });

  server.route({
    method: 'GET',
    path: '/api/scripts/running-records',
    handler() {
      return {records: recordService.runningRecords};
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
