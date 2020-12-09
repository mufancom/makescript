import * as CP from 'child_process';

import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
} from '../types';

export class ExecutableAdapter implements IAdapter {
  type = 'executable';

  async runScript({
    source,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
    onError,
  }: AdapterRunScriptArgument): Promise<AdapterRunScriptResult> {
    try {
      let cp = CP.spawn(source, {
        env: {
          ...process.env,
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
