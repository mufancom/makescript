import * as Path from 'path';

import Hapi from '@hapi/hapi';

import {Config} from '../../config';

const INDEX_FILE_NAME = 'index.html';

export function routeResources(server: Hapi.Server, config: Config): void {
  server.route({
    method: 'GET',
    path: '/resources/{id}/{path*}',
    handler(request, h) {
      let id = request.params.id;
      let path = request.params.path ?? '';

      // TODO: check resource expires

      let realPath = Path.join(config.resourcesPath, id, path);

      if (path && /.+\..+/.test(path)) {
        return h.file(realPath, {confine: false});
      }

      return h.file(Path.join(realPath, INDEX_FILE_NAME), {
        confine: false,
      });
    },
    options: {
      auth: false,
    },
  });
}
