import * as CP from 'child_process';
import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import Bcrypt from 'bcrypt';
import rimraf from 'rimraf';
import {Dict} from 'tslang';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {zip} from '../@utils';
import {OUTPUT_CLEAR_CHARACTER} from '../constants';
import {logger} from '../shared';
import {
  AdapterRunScriptArgument,
  IAdapter,
  ScriptDefinition,
  ScriptDefinitionHooks,
  ScriptRunningArgument,
  ScriptRunningResult,
} from '../types';

import {ScriptService} from './script-service';
import {SocketService} from './socket-service';

const MAKESCRIPT_TMPDIR = Path.join(OS.tmpdir(), 'makescript-temp');

const OUTPUT_FLUSH_INTERVAL_TIME = 1000;

export class RunningService {
  private adapterMap = new Map<string, IAdapter<ScriptDefinition>>();

  constructor(
    private scriptService: ScriptService,
    private socketService: SocketService,
  ) {}

  async triggerHook(
    scriptName: string,
    hookName: keyof ScriptDefinitionHooks,
  ): Promise<void> {
    let definition = this.requireScriptDefinition(scriptName);

    let hookContent = definition.hooks?.[hookName];

    if (!hookContent) {
      throw new Error(
        `The hook "${hookName}" of script "${scriptName}" is not configured.`,
      );
    }

    let cp = CP.exec(hookContent, {
      cwd: this.scriptService.scriptsBasePath,
      env: {
        ...process.env,
        ...this.scriptService.getEnvByScriptName(scriptName),
      },
    });

    await villa.awaitable(cp);
  }

  async runScript(
    argument: ScriptRunningArgument,
  ): Promise<ScriptRunningResult> {
    let {name, parameters, resourcesBaseURL} = argument;

    logger.info(`Running record "${argument.id}" of script "${argument.name}"`);

    let definition = this.requireScriptDefinition(name);

    await this.validatePassword(definition, argument);

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
      repoPath: this.scriptService.scriptsBasePath,
      cwd: this.scriptService.scriptsPath,
      env: this.scriptService.getEnvByScriptName(name),
      definition,
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
    let scriptDefinition = this.scriptService.getDefaultValueFilledScriptDefinitionByName(
      name,
    );

    if (!scriptDefinition) {
      throw new Error(`Script definition "${name}" not found`);
    }

    return scriptDefinition;
  }

  private async validatePassword(
    scriptDefinition: ScriptDefinition,
    {password}: ScriptRunningArgument,
  ): Promise<void> {
    if (!scriptDefinition.passwordHash) {
      return;
    }

    let result = await Bcrypt.compare(password, scriptDefinition.passwordHash);

    if (!result) {
      throw new Error(
        `Password error: the password provided to running "${scriptDefinition.name}" is not match`,
      );
    }
  }

  private requireAdapter<TDefinition extends ScriptDefinition>(
    scriptDefinition: TDefinition,
  ): IAdapter<TDefinition> {
    let adapter = this.adapterMap.get(scriptDefinition.type);

    if (!adapter) {
      // TODO:
      throw Error(
        `Adapter for script type "${scriptDefinition.type}" not found`,
      );
    }

    return adapter as IAdapter<TDefinition>;
  }

  private resolveOptions(scriptDefinition: ScriptDefinition): Dict<unknown> {
    if (!scriptDefinition.options) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(scriptDefinition.options).map(([name, value]) => {
        if (value.type === 'value') {
          return [name, value.value];
        } else if (value.type === 'env') {
          let resolvedValue = process.env[value.env];

          if (!resolvedValue && value.required) {
            // TODO:
            throw new Error();
          }

          return [name, resolvedValue];
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
  ): {
    onOutput: AdapterRunScriptArgument<ScriptDefinition>['onOutput'];
    done(): Promise<string>;
  } {
    let output = '';

    let lastFlushedText: string | undefined;

    let flushOutput = (): void => {
      if (error) {
        return;
      }

      let textToFlush = getTextToFlush(output);

      if (!textToFlush || textToFlush === lastFlushedText) {
        return;
      }

      // TODO: Ensure sequence in time
      this.socketService.makescriptRPC
        .updateOutput(argument.id, textToFlush)
        .catch(logger.error);
    };

    let timer = setInterval(() => {
      flushOutput();
    }, OUTPUT_FLUSH_INTERVAL_TIME);

    return {
      onOutput: data => {
        output += data;
      },
      done: async () => {
        clearInterval(timer);

        flushOutput();

        return output;
      },
    };
  }
}

function validateParameters(
  parameters: Dict<unknown>,
  definition: ScriptDefinition,
): [Dict<unknown>, Dict<unknown>] {
  if (!definition.parameters) {
    return [{}, {}];
  }

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

function getTextToFlush(text: string): string | undefined {
  if (!text.includes(OUTPUT_CLEAR_CHARACTER)) {
    return text;
  }

  let splitTexts = text.split(OUTPUT_CLEAR_CHARACTER);

  return splitTexts[splitTexts.length - 1];
}
