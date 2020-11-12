import Boom from '@hapi/boom';
import Hapi, {ServerAuthSchemeObject} from '@hapi/hapi';

import {Entrances} from '../@entrances';
import {Config} from '../config';

import {routeRunning} from './@running';
import {routeScripts} from './@scripts';

const TOKEN_REQUEST_HEADER_NAME = 'x-access-token';

const TOKEN_AUTH_SCHEME_NAME = 'token';
const TOKEN_AUTH_STRATEGY_NAME = 'token';

export async function serveAPI(
  entrances: Entrances,
  config: Config,
): Promise<void> {
  const server = Hapi.server({
    port: config.port,
    host: config.host,
  });

  server.auth.scheme(
    TOKEN_AUTH_SCHEME_NAME,
    (): ServerAuthSchemeObject => {
      return {
        authenticate(request, h): Hapi.Lifecycle.ReturnValue {
          if (request.headers[TOKEN_REQUEST_HEADER_NAME] !== config.token) {
            return Boom.unauthorized();
          }

          return h.authenticated({credentials: {}});
        },
      };
    },
  );

  server.auth.strategy(TOKEN_AUTH_STRATEGY_NAME, TOKEN_AUTH_SCHEME_NAME);
  server.auth.default(TOKEN_AUTH_STRATEGY_NAME);

  server.route({
    method: 'GET',
    path: '/ping',
    handler() {
      return 'pong';
    },
  });

  routeAPI(entrances, server);

  await server.start();
  console.info(`Makescript agent server is running on port ${config.port}`);
}

function routeAPI(entrances: Entrances, server: Hapi.Server): void {
  routeScripts(entrances.scriptService, server);
  routeRunning(entrances.runningService, server);
}
