import 'villa/platform/node';

import Hapi from '@hapi/hapi';
import {
  Config as AgentConfig,
  main as agentMain,
} from '@makeflow/makescript-agent';
import {Tiva} from 'tiva';

import {serveAPI} from './@api';
import {Entrances} from './@entrances';
import {Config} from './config';

export async function main(
  tiva: Tiva,
  config: Config,
  defaultAgentConfig: AgentConfig | undefined,
): Promise<void> {
  let server = Hapi.server({
    host: config.listen.host,
    port: config.listen.port,
  });

  let entrances = new Entrances(server.listener, config);

  await entrances.ready;

  await serveAPI(server, entrances);

  if (defaultAgentConfig) {
    await agentMain(tiva, defaultAgentConfig);
  }
}
