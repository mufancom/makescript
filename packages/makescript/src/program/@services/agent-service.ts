import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {
  AdapterRunScriptResult,
  ScriptRunningArgumentParameter,
} from '@makeflow/makescript-agent';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {ExpectedError} from '../@core';
import {zip} from '../@utils';
import {Config} from '../config';

export class AgentService {
  constructor(private config: Config) {}

  async updateScriptsForAllAgents(scriptsPath: string): Promise<void> {
    let agents = this.config.agents;

    if (!agents) {
      return;
    }

    let temporaryFilePath = Path.join(OS.tmpdir(), uuidv4());

    await zip(scriptsPath, temporaryFilePath);

    let readStream = FS.createReadStream(temporaryFilePath);

    await Promise.all(
      agents.map(async agent => {
        let response = await fetch(`${agent.url}/scripts/sync`, {
          method: 'POST',
          body: readStream,
        });

        if (!response.ok) {
          // TODO:
          throw Error(response.statusText);
        }
      }),
    );

    readStream.close();

    await villa.async(rimraf)(temporaryFilePath);
  }

  async runScript(
    namespace: string,
    {
      id,
      name,
      parameters,
      resourcesBaseURL,
      hostURL,
    }: {
      id: string;
      name: string;
      parameters: ScriptRunningArgumentParameter[];
      resourcesBaseURL: string;
      hostURL: string;
    },
  ): Promise<AdapterRunScriptResult> {
    let agent = this.config.agents.find(agent => agent.namespace === namespace);

    if (!agent) {
      throw new ExpectedError('AGENT_NAMESPACE_NOT_FOUND');
    }

    let response = await fetch(`${agent.url}/running/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': agent.token,
      },
      body: JSON.stringify({
        token: id,
        name,
        parameters,
        resourcesBaseURL,
        hostURL,
      }),
    });

    if (!response.ok) {
      throw new ExpectedError('REQUEST_FAILED', response.statusText);
    }

    return response.json();
  }
}
