import * as Path from 'path';

import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';

import {Entrances} from '../../@entrances';

import {routeAgent} from './@agent';
import {setupAuth} from './@auth';
import {routeAuthorization} from './@authorization';
import {routeMakeflow} from './@makeflow';
import {routeResources} from './@resources';
import {routeTokens} from './@tokens';

const WEB_STATIC_PATH = Path.join(__dirname, '..', '..', '..', 'web');
const WEB_STATIC_PATH_INDEX = Path.join(WEB_STATIC_PATH, 'index.html');

export async function serveWeb(
  server: Hapi.Server,
  entrances: Entrances,
): Promise<void> {
  await server.register(Inert);

  await setupAuth(entrances.userService, server);

  routeAuthorization(entrances.userService, server);
  routeAgent(
    entrances.agentService,
    entrances.runningService,
    server,
    entrances.config,
  );
  routeTokens(entrances.tokenService, server);
  routeMakeflow(entrances.makeflowService, server);

  routeResources(server, entrances.config);

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
