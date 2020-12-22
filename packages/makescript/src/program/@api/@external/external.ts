import Hapi from '@hapi/hapi';

import {Entrances} from '../../@entrances';

import {setupAuth} from './@auth';
import {routeMakeflow} from './@makeflow';
import {routeRunning} from './@running';

export async function serveExternalAPI(
  server: Hapi.Server,
  entrances: Entrances,
): Promise<void> {
  setupAuth(entrances.tokenService, server);

  routeMakeflow(entrances.makeflowService, server);
  routeRunning(entrances.runningService, server);

  await server.start();
}
