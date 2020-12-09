import Hapi from '@hapi/hapi';

import {Entrances} from '../../@entrances';
import {logger} from '../../@utils';

import {routeMakeflow} from './@makeflow';

export async function serveExternalAPI(
  server: Hapi.Server,
  entrances: Entrances,
): Promise<void> {
  routeMakeflow(entrances.makeflowService, server);

  await server.start();

  logger.info(`Makescript api is running on port ${entrances.config.api.port}`);
}
