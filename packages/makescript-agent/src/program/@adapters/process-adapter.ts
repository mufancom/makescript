import * as CP from 'child_process';

import NPMWhich from 'npm-which';
import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
  ProcessScriptDefinition,
} from '../types';

export class ProcessAdapter implements IAdapter<ProcessScriptDefinition> {
  type = 'process' as const;

  async runScript({
    cwd,
    env,
    definition,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
    onError,
  }: AdapterRunScriptArgument<ProcessScriptDefinition>): Promise<
    AdapterRunScriptResult
  > {
    const which = NPMWhich(cwd);

    try {
      let commandPath = await villa.call(which, definition.command);

      let cp = CP.spawn(commandPath, {
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
