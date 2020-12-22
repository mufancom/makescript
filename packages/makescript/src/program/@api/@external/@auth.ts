import Boom from '@hapi/boom';
import Hapi, {ServerAuthSchemeObject} from '@hapi/hapi';

import {TokenService} from '../../@services';

const TOKEN_AUTHORIZATION_REGEX = /^Token ([\w\-]+)$/i;

const TOKEN_AUTH_SCHEME_NAME = 'token';
export const TOKEN_AUTH_STRATEGY_NAME = 'token';

export function setupAuth(
  tokenService: TokenService,
  server: Hapi.Server,
): void {
  server.auth.scheme(
    TOKEN_AUTH_SCHEME_NAME,
    (): ServerAuthSchemeObject => {
      return {
        authenticate(request, h): Hapi.Lifecycle.ReturnValue {
          let authorization = request.headers['authorization']?.trim();
          let authorizationExecResult =
            authorization && TOKEN_AUTHORIZATION_REGEX.exec(authorization);

          if (
            !authorization ||
            !authorizationExecResult ||
            !authorizationExecResult[1]
          ) {
            return Boom.unauthorized();
          }

          let activeToken = tokenService.getActiveToken(
            authorizationExecResult[1],
          );

          if (!activeToken) {
            return Boom.unauthorized();
          }

          return h.authenticated({
            credentials: {tokenLabel: activeToken.label},
          });
        },
      };
    },
  );

  server.auth.strategy(TOKEN_AUTH_STRATEGY_NAME, TOKEN_AUTH_SCHEME_NAME);
}
