import Hapi from '@hapi/hapi';

import {getResourcePath} from '../../@utils/resource';
import {Config} from '../../config';

export function routeResources(server: Hapi.Server, config: Config): void {
  server.route({
    method: 'GET',
    path: '/resources/{id}/{path*}',
    async handler(request, h) {
      let id = request.params.id;
      let path = request.params.path ?? '';

      let realPath = await getResourcePath(id, path, config);

      return h.file(realPath, {confine: false});
    },
    options: {
      auth: false,
    },
  });
}
