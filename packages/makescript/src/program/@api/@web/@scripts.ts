import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import type {Dict} from 'tslang';

import {AgentService, RunningService} from '../../@services';
import {Config} from '../../config';

export function routeScripts(
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
        url: config.http.url,
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
    method: 'POST',
    path: '/api/scripts/run',
    async handler(request) {
      let {namespace, name, parameters, password} = request.payload as {
        namespace: string;
        name: string;
        parameters: Dict<unknown>;
        password: string | undefined;
      };

      await runningService.runScriptDirectly({
        namespace,
        name,
        parameters,
        password,
      });

      return {};
    },
    options: {
      validate: {
        payload: Joi.object({
          namespace: Joi.string(),
          name: Joi.string(),
          parameters: Joi.object(),
          password: Joi.string().optional(),
        }) as any,
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/api/scripts',
    async handler() {
      let scriptDefinitionsMap = await agentService.getScriptDefinitionsMap();

      return {
        url: config.http.url,
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

      await runningService.runScriptFromRecords(id, password);

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
