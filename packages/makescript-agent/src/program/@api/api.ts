import Boom from '@hapi/boom';
import Hapi, {ServerAuthSchemeObject} from '@hapi/hapi';

const TOKEN_REQUEST_HEADER_NAME = 'x-access-token';

const TOKEN_AUTH_SCHEME_NAME = 'token';
const TOKEN_AUTH_STRATEGY_NAME = 'token';

export interface ServeAPIOptions {
  port: number;
  host: string;
  token: string;
}

export async function serveAPI(options: ServeAPIOptions): Promise<void> {
  const server = Hapi.server({
    port: options.port,
    host: options.host,
  });

  server.auth.scheme(
    TOKEN_AUTH_SCHEME_NAME,
    (): ServerAuthSchemeObject => {
      return {
        authenticate(request, h): Hapi.Lifecycle.ReturnValue {
          if (request.headers[TOKEN_REQUEST_HEADER_NAME] !== options.token) {
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

  await server.start();
  console.info(`Makescript agent server is running on port ${options.port}`);
}
