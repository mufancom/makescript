import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import fetch from 'node-fetch';
import rimraf from 'rimraf';
import {Dict} from 'tslang';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {zip} from '../@utils';
import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
  ScriptDefinition,
  ScriptRunningArgument,
  ScriptRunningArgumentParameter,
} from '../types';

import {ScriptService} from './script-service';

export class RunningService {
  private adapterMap = new Map<string, IAdapter>();

  constructor(private scriptService: ScriptService) {}

  async runScript(
    argument: ScriptRunningArgument,
  ): Promise<AdapterRunScriptResult> {
    let {name, parameters: parameterArray, resourcesBaseURL} = argument;

    let definition = this.requireScriptDefinition(name);
    let source = this.resolveSource(definition);
    let adapter = this.requireAdapter(definition);
    let options = this.resolveOptions(definition);
    let parameters = this.transformParameters(parameterArray);
    let resourcesPath = this.generateRandomResourcesPath();

    let {onOutput, done: onOutputDone} = this.getOnOutput(
      argument,
      definition,
      false,
    );
    let {onOutput: onError, done: onErrorDone} = this.getOnOutput(
      argument,
      definition,
      true,
    );

    let result = await adapter.runScript({
      source,
      parameters,
      options,
      resourcesPath,
      resourcesBaseURL,
      onOutput,
      onError,
    });

    onOutputDone();
    onErrorDone();

    await this.handleResources(argument, resourcesPath);

    return result;
  }

  registerAdapter(type: string, adapter: IAdapter): void {
    this.adapterMap.set(type, adapter);
  }

  private requireScriptDefinition(name: string): ScriptDefinition {
    let scriptDefinition = this.scriptService.getScriptDefinitionByName(name);

    if (!scriptDefinition) {
      // TODO:
      throw new Error();
    }

    return scriptDefinition;
  }

  private resolveSource(scriptDefinition: ScriptDefinition): string {
    let source = this.scriptService.resolveSource(scriptDefinition);

    // TODO: check

    return source;
  }

  private requireAdapter(scriptDefinition: ScriptDefinition): IAdapter {
    let adapter = this.adapterMap.get(scriptDefinition.type);

    if (!adapter) {
      // TODO:
      throw Error();
    }

    return adapter;
  }

  private resolveOptions(scriptDefinition: ScriptDefinition): Dict<unknown> {
    return Object.fromEntries(
      scriptDefinition.options.map(option => {
        if (option.type === 'value') {
          return [option.name, option.value];
        } else if (option.type === 'env') {
          let resolvedValue = process.env[option.env];

          if (!resolvedValue && option.required) {
            // TODO:
            throw new Error();
          }

          return [option.name, resolvedValue];
        }

        // TODO:
        throw new Error();
      }),
    );
  }

  private transformParameters(
    parameters: ScriptRunningArgumentParameter[],
  ): Dict<unknown> {
    return Object.fromEntries(
      parameters.map(parameter => [parameter.name, parameter.value]),
    );
  }

  private generateRandomResourcesPath(): string {
    return Path.join(OS.tmpdir(), 'makescript', 'agent', 'resources', uuidv4());
  }

  private async handleResources(
    argument: ScriptRunningArgument,
    resourcesPath: string,
  ): Promise<void> {
    if (!FS.existsSync(resourcesPath)) {
      return;
    }

    let temporaryArchiveFilePath = Path.join(OS.tmpdir(), `${uuidv4()}.zip`);

    await zip(resourcesPath, temporaryArchiveFilePath);

    let resourceCallbackAPI = getCallbackAPI(argument, 'resources');

    let fileStream = FS.createReadStream(temporaryArchiveFilePath);

    await fetch(resourceCallbackAPI, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream,
    });

    await villa.async(rimraf)(temporaryArchiveFilePath);
  }

  private getOnOutput(
    argument: ScriptRunningArgument,
    scriptDefinition: ScriptDefinition,
    error: boolean,
  ): {onOutput: AdapterRunScriptArgument['onOutput']; done(): void} {
    let outputMode = scriptDefinition.config.output;

    let outputCallbackAPI = getCallbackAPI(
      argument,
      error ? 'error' : 'output',
    );

    let output = '';

    return {
      onOutput: data => {
        if (outputMode === 'cover') {
          output = data;
        } else {
          output += data;
        }

        if (outputMode === 'stream' || outputMode === 'cover') {
          fetch(outputCallbackAPI, {
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content: output}),
          }).catch(console.error);
        }
      },
      done: () => {
        if (outputMode === 'aggregate') {
          fetch(outputCallbackAPI, {
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content: output}),
          }).catch(console.error);
        }
      },
    };
  }
}

function getCallbackAPI(
  {hostURL, token}: ScriptRunningArgument,
  type: 'output' | 'error' | 'resources',
): string {
  return `${hostURL}/api/agent-callback/${type}/${token}`;
}
