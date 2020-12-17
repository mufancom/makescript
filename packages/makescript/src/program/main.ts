import * as Path from 'path';
import {URL} from 'url';

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

const DEFAULT_AGENT_NAMESPACE = 'default';
const DEFAULT_AGENT_RELATIVE_PATH = 'agent';

const AGENT_MODULE = '@makeflow/makescript-agent';

export async function main(tiva: Tiva, config: Config): Promise<void> {
  let webServer = Hapi.server({
    host: config.webAdmin.host,
    port: config.webAdmin.port,
  });

  let externalAPIServer = Hapi.server({
    host: config.api.host,
    port: config.api.port,
  });

  let entrances = new Entrances(externalAPIServer.listener, config);

  await entrances.ready;

  await serveAPI(webServer, externalAPIServer, entrances);

  let defaultAgentConfig = generateAgentConfig();

  if (defaultAgentConfig) {
    await agentMain(tiva, defaultAgentConfig);
  }

  function generateAgentConfig(): AgentConfig | undefined {
    if (!config.defaultAgent?.scriptsRepoURL) {
      return undefined;
    }

    // Convert join link to localhost, because in theory, the default agent can be directly access MakeScript locally.
    let joinLinkURL = new URL(entrances.agentService.joinLink);
    joinLinkURL.host = `${config.api.host}:${config.api.port}`;

    return {
      makescriptSecretURL: joinLinkURL.toString(),
      namespace: DEFAULT_AGENT_NAMESPACE,
      scriptsRepoURL: config.defaultAgent.scriptsRepoURL,
      agentModule: AGENT_MODULE,
      workspace: Path.join(config.workspace, DEFAULT_AGENT_RELATIVE_PATH),
      proxy: undefined,
    };
  }
}
