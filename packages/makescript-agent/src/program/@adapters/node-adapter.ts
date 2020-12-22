import * as CP from 'child_process';

import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
} from '../types';

export class NodeAdapter implements IAdapter {
  type = 'node';

  async runScript({
    cwd,
    env,
    source,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
    onError,
  }: AdapterRunScriptArgument): Promise<AdapterRunScriptResult> {
    try {
      let cp = CP.spawn(`node`, [source], {
        cwd,
        env: {
          ...process.env,
          ...env,
          RESOURCE_PATH: resourcePath,
          RESOURCE_BASE_URL: resourceBaseURL,
          ...parameters,
        },
      });

      cp.stdout.on('data', (buffer: Buffer) => {
        onOutput(buffer.toString());
      });
      cp.stderr.on('data', (buffer: Buffer) => {
        onError(buffer.toString());
      });

      await villa.awaitable(cp);

      return {result: 'done', message: ''};
    } catch (error) {
      return {result: 'unknown-error', message: error.message ?? String(error)};
    }
  }
}
