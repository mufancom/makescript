import * as CP from 'child_process';

import NPMWhich from 'npm-which';
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
        process: {
          command: string;
        };
      }
    }
  }
}

export class ProcessAdapter
  implements
    IAdapter<
      Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'process'}>
    > {
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
  }: AdapterRunScriptArgument<
    Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'process'}>
  >): Promise<AdapterRunScriptResult> {
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

      return {ok: true, message: ''};
    } catch (error) {
      return {ok: false, message: error.message ?? String(error)};
    }
  }
}
