import * as CP from 'child_process';

import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
  ShellScriptDefinition,
} from '../types';

export class ShellAdapter implements IAdapter<ShellScriptDefinition> {
  type = 'shell' as const;

  async runScript({
    cwd,
    env,
    definition,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
    onError,
  }: AdapterRunScriptArgument<ShellScriptDefinition>): Promise<
    AdapterRunScriptResult
  > {
    try {
      let cp = CP.exec(definition.command, {
        cwd,
        env: {
          ...process.env,
          ...env,
          RESOURCE_PATH: resourcePath,
          RESOURCE_BASE_URL: resourceBaseURL,
          ...parameters,
        },
      });

      cp.stdout?.on('data', (buffer: Buffer) => {
        onOutput(buffer.toString());
      });
      cp.stderr?.on('data', (buffer: Buffer) => {
        onError(buffer.toString());
      });

      await villa.awaitable(cp);

      return {result: 'done', message: ''};
    } catch (error) {
      return {result: 'unknown-error', message: error.message ?? String(error)};
    }
  }
}
