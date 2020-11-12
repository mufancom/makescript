import Hapi from '@hapi/hapi';

import {ScriptService} from '../@services';

interface FilePayload {
  path: string;
  bytes: number;
}

export function routeScripts(
  scriptService: ScriptService,
  server: Hapi.Server,
): void {
  server.route({
    method: 'POST',
    path: '/scripts/sync',
    async handler(request) {
      let payload = request.payload as FilePayload;

      return scriptService.syncScripts(payload.path);
    },
    options: {
      payload: {
        parse: true,
        output: 'file',
      },
    },
  });
}
