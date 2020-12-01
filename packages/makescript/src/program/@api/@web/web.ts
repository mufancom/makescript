import * as Path from 'path';

import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';

import {Entrances} from '../../@entrances';

import {setupAuth} from './@auth';
import {routeAuthorization} from './@authorization';
import {routeMakeflow} from './@makeflow';
import {routeScripts} from './@scripts';
import {routeTokens} from './@tokens';

const WEB_STATIC_PATH = Path.join(__dirname, '..', '..', '..', 'web');
const WEB_STATIC_PATH_INDEX = Path.join(WEB_STATIC_PATH, 'index.html');

export async function serveWeb(entrances: Entrances): Promise<void> {
  let server = Hapi.server({
    port: entrances.config.webAdmin.port,
    host: entrances.config.webAdmin.host,
    state: {
      strictHeader: false,
    },
  });

  await server.register(Inert);

  await setupAuth(entrances.userService, server);

  routeAuthorization(entrances.userService, server);
  routeScripts(entrances.scriptService, entrances.runningService, server);
  routeTokens(entrances.tokenService, server);
  routeMakeflow(entrances.makeflowService, server);

  server.route({
    method: 'GET',
    path: '/{path*}',
    handler(request, h) {
      let path = request.params.path;

      if (/.+\..+/.test(path)) {
        return h.file(Path.join(WEB_STATIC_PATH, path));
      }

      return h.file(WEB_STATIC_PATH_INDEX);
    },
    options: {
      auth: false,
    },
  });
  await server.start();

  console.info(
    `Makescript web ui is running on port ${entrances.config.webAdmin.port}`,
  );
}
