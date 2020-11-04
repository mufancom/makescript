import {serveAPI} from './@api';
import {Config} from './@config';
import {Entrances} from './@entrances';
import {MakescriptAgentConfig} from './config';

export async function main(
  configContent: MakescriptAgentConfig,
  workspace: string,
): Promise<void> {
  let config = transformConfig(configContent, workspace);

  let entrances = new Entrances(config);

  await serveAPI(entrances, config);
}

function transformConfig(
  config: MakescriptAgentConfig,
  workspace: string,
): Config {
  return {
    port: config.port,
    host: config.host,
    token: config.token,
    workspace,
  };
}
