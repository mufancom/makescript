import * as CP from 'child_process';

import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
  NodeScriptDefinition,
} from '../types';

export class NodeAdapter implements IAdapter<NodeScriptDefinition> {
  type = 'node' as const;

  async runScript({
    cwd,
    env,
    definition,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
    onError,
  }: AdapterRunScriptArgument<NodeScriptDefinition>): Promise<
    AdapterRunScriptResult
  > {
    try {
      let cp = CP.spawn(`node`, [definition.module], {
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
