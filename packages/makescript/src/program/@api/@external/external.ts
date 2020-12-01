import Hapi from '@hapi/hapi';

import {Entrances} from '../../@entrances';

import {routeMakeflow} from './@makeflow';

export async function serveExternalAPI(entrances: Entrances): Promise<void> {
  let server = Hapi.server({
    port: entrances.config.api.port,
    host: entrances.config.api.host,
  });

  routeMakeflow(entrances.makeflowService, server);

  await server.start();

  console.info(
    `Makescript api is running on port ${entrances.config.api.port}`,
  );
}
