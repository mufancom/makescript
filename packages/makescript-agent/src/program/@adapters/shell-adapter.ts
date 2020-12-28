import * as CP from 'child_process';

import * as villa from 'villa';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
} from '../types';

declare global {
  namespace MakeScript {
    namespace Adapter {
      interface AdapterOptionsDict {
        shell: {
          command: string;
        };
      }
    }
  }
}

export class ShellAdapter
  implements
    IAdapter<
      Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'shell'}>
    > {
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
  }: AdapterRunScriptArgument<
    Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'shell'}>
  >): Promise<AdapterRunScriptResult> {
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

      return {ok: true, message: ''};
    } catch (error) {
      return {ok: false, message: error.message ?? String(error)};
    }
  }
}
