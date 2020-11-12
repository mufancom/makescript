import Hapi from '@hapi/hapi';

import {Entrances} from '../@entrances';

import {routeMakeflow} from './@makeflow';

export async function serveAPI(entrances: Entrances): Promise<void> {
  await serveExternalAPI(entrances);
  await serveWeb(entrances);
}

async function serveWeb(entrances: Entrances): Promise<void> {
  let server = Hapi.server({
    port: entrances.config.webPort,
    host: entrances.config.host,
  });

  await server.start();
  console.info(
    `Makescript web ui is running on port ${entrances.config.webPort}`,
  );
}

async function serveExternalAPI(entrances: Entrances): Promise<void> {
  let server = Hapi.server({
    port: entrances.config.port,
    host: entrances.config.host,
  });

  routeMakeflow(server);

  await server.start();
  console.info(`Makescript api is running on port ${entrances.config.port}`);
}
