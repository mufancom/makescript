import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import rimraf from 'rimraf';
import {Dict} from 'tslang';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {zip} from '../@utils';
import {logger} from '../shared';
import {
  AdapterRunScriptArgument,
  IAdapter,
  ScriptDefinition,
  ScriptRunningArgument,
  ScriptRunningResult,
} from '../types';

import {ScriptService} from './script-service';
import {SocketService} from './socket-service';

const MAKESCRIPT_TMPDIR = Path.join(OS.tmpdir(), 'makescript-temp');

const OUTPUT_FLUSH_CHARACTER = '\r';

export class RunningService {
  private adapterMap = new Map<string, IAdapter>();

  constructor(
    private scriptService: ScriptService,
    private socketService: SocketService,
  ) {}

  async runScript(
    argument: ScriptRunningArgument,
  ): Promise<ScriptRunningResult> {
    let {name, parameters, resourcesBaseURL} = argument;

    logger.info(`Running record "${argument.id}" of script "${argument.name}"`);

    let definition = this.requireScriptDefinition(name);
    let source = this.resolveSource(definition);
    let adapter = this.requireAdapter(definition);
    let options = this.resolveOptions(definition);
    let resourcesPath = this.generateRandomResourcesPath();
    let [allowedParameters, deniedParameters] = validateParameters(
      parameters,
      definition,
    );

    let {onOutput, done: onOutputDone} = this.getOnOutput(argument, false);
    let {onOutput: onError, done: onErrorDone} = this.getOnOutput(
      argument,
      true,
    );

    let result = await adapter.runScript({
      source,
      parameters: allowedParameters,
      options,
      resourcesPath,
      resourcesBaseURL,
      onOutput,
      onError,
    });

    let output = await onOutputDone();
    let error = await onErrorDone();

    await this.handleResources(argument, resourcesPath);

    logger.info(
      `Complete running record "${argument.id}" of script "${argument.name}"`,
    );

    return {
      name,
      displayName: definition.displayName,
      parameters,
      deniedParameters,
      result,
      output: {
        output,
        error,
      },
    };
  }

  registerAdapter(type: string, adapter: IAdapter<any>): void {
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
      throw Error(
        `Adapter for script type "${scriptDefinition.type}" not found`,
      );
    }

    return adapter;
  }

  private resolveOptions(scriptDefinition: ScriptDefinition): Dict<unknown> {
    if (!scriptDefinition.options) {
      return {};
    }

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

    logger.info(
      `Transmitting resources for record "${argument.id}" of script "${argument.name}"`,
    );

    let temporaryArchiveFilePath = Path.join(
      MAKESCRIPT_TMPDIR,
      `${uuidv4()}.zip`,
    );

    if (!FS.existsSync(MAKESCRIPT_TMPDIR)) {
      FS.mkdirSync(MAKESCRIPT_TMPDIR);
    }

    await zip(resourcesPath, temporaryArchiveFilePath);

    let buffer = await villa.async(FS.readFile)(temporaryArchiveFilePath);

    await this.socketService.makescriptRPC.updateResources(argument.id, buffer);

    await villa.async(rimraf)(temporaryArchiveFilePath);
  }

  private getOnOutput(
    argument: ScriptRunningArgument,
    error: boolean,
  ): {onOutput: AdapterRunScriptArgument['onOutput']; done(): Promise<string>} {
    let output = '';

    let lastFlushedText: string | undefined;

    return {
      onOutput: data => {
        output += data;

        let textToFlush = getTextToFlush(output);

        if (!textToFlush || textToFlush === lastFlushedText) {
          return;
        }

        if (!error) {
          return;
        }

        this.socketService.makescriptRPC
          .updateOutput(argument.id, textToFlush)
          .catch(logger.error);
      },
      done: async () => {
        let textToFlush = getTextToFlush(output, true);

        if (!error && textToFlush && textToFlush !== lastFlushedText) {
          await this.socketService.makescriptRPC
            .updateOutput(argument.id, textToFlush)
            .catch(logger.error);
        }

        return output;
      },
    };
  }
}

function validateParameters(
  parameters: Dict<unknown>,
  definition: ScriptDefinition,
): [Dict<unknown>, Dict<unknown>] {
  let {filteredParameters, missingParameters} = definition.parameters.reduce<{
    filteredParameters: Dict<unknown>;
    missingParameters: string[];
  }>(
    (reducer, parameterDefinition) => {
      let {filteredParameters, missingParameters} = reducer;

      let parameterName =
        typeof parameterDefinition === 'object'
          ? parameterDefinition.name
          : parameterDefinition;
      let parameterRequired =
        typeof parameterDefinition === 'object'
          ? parameterDefinition.required
          : false;

      let parameterValue = parameters[parameterName];

      let serializedValue =
        typeof parameterValue === 'object'
          ? JSON.stringify(parameterValue)
          : parameterValue;

      if (serializedValue !== undefined) {
        filteredParameters[parameterName] = serializedValue;
      } else {
        if (parameterRequired) {
          missingParameters.push(parameterName);
        }
      }

      return reducer;
    },
    {filteredParameters: {}, missingParameters: []},
  );

  if (missingParameters.length) {
    throw new Error(
      `Missing command required parameters "${missingParameters.join('", "')}"`,
    );
  }

  let deniedParameters = Object.fromEntries(
    Object.entries(parameters).filter(([key]) => !(key in filteredParameters)),
  );

  return [filteredParameters, deniedParameters];
}

function getTextToFlush(text: string, immediate = false): string | undefined {
  if (!immediate && !text.includes(OUTPUT_FLUSH_CHARACTER)) {
    return undefined;
  }

  let splitTexts = text.split(OUTPUT_FLUSH_CHARACTER);

  let offsetForward = immediate ? 0 : 1;

  return splitTexts[splitTexts.length - offsetForward - 1];
}
