import {
  ScriptDefinition,
  ScriptDefinitionParameter,
} from '@makeflow/makescript-agent';
import type {
  PowerApp,
  PowerAppConfig,
  PowerAppInput,
  PowerItem,
} from '@makeflow/types';
import fetch from 'node-fetch';
import semver from 'semver';
import type {Dict} from 'tslang';

import {ExpectedError} from '../@core';
import {Config} from '../config';
import {MFUserCandidate} from '../types/makeflow';

import {DBService} from './db-service';
import {RunningService} from './running-service';
import {ScriptService} from './script-service';
import {TokenService} from './token-service';

const TASK_NUMERIC_ID_INPUT_NAME = 'taskNumericId' as PowerAppInput.Name;
const TASK_NUMERIC_ID_VARIABLE = 'task_numericId';
const TASK_BRIEF_INPUT_NAME = 'taskBrief' as PowerAppInput.Name;
const TASK_BRIEF_VARIABLE = 'task_brief';
const TASK_ASSIGNEE_INPUT_NAME = 'taskAssignee' as PowerAppInput.Name;
const TASK_ASSIGNEE_VARIABLE = 'task_assignee';
const TASK_URL_INPUT_NAME = 'taskURL' as PowerAppInput.Name;
const TASK_URL_VARIABLE = 'task_url';

export class MakeflowService {
  constructor(
    private scriptService: ScriptService,
    private runningService: RunningService,
    private tokenService: TokenService,
    private dbService: DBService,
    private config: Config,
  ) {}

  async listUserCandidates(
    username: string,
    password: string,
  ): Promise<MFUserCandidate> {
    return this.requestAPI(
      '/account/list-users',
      {
        mobile: username,
        password,
      },
      false,
    );
  }

  async authenticate(
    username: string,
    password: string,
    userId: string,
  ): Promise<void> {
    let token = await this.requestAPI(
      '/access-token/create',
      {
        mobile: username,
        password,
        user: userId,
        permissions: [],
      },
      false,
    );

    await this.dbService.db.get('makeflow').set('loginToken', token).write();
  }

  checkAuthentication(): boolean {
    let makeflowSettings = this.dbService.db.get('makeflow').value();

    return !!makeflowSettings.loginToken;
  }

  async triggerAction(
    actionName: string,
    powerItemToken: string,
    inputs: Dict<unknown>,
    accessToken: string,
  ): Promise<void> {
    let {namespace, name} = convertActionNameToScriptName(actionName);

    // TODO: check token
    let tokenLabel =
      this.tokenService.getActiveToken(accessToken)?.label ?? 'Unknown';

    let {
      taskNumericId,
      taskBrief,
      taskAssignee,
      taskURL,
      ...parameters
    } = inputs;

    await this.runningService.enqueueRunningRecord({
      namespace,
      name,
      triggerTokenLabel: tokenLabel,
      parameters,
      makeflowTask: {
        taskUrl: taskURL as string,
        numericId: taskNumericId as number,
        brief: taskBrief as string,
        assignee: taskAssignee,
        powerItemToken,
      },
    });
  }

  async publishPowerApp(): Promise<void> {
    let powerAppDefinition = await this.generateAppDefinition();

    await this.requestAPI(
      '/power-app/publish',
      {definition: powerAppDefinition},
      true,
    );

    await this.increasePowerAppVersion();
  }

  async generateAppDefinition(): Promise<PowerApp.RawDefinition> {
    let scriptsDefinition = await this.scriptService.scriptsDefinition;
    let makeflowInfo = this.dbService.db.get('makeflow').value();

    let hookBaseURL = `${this.config.api.url}/api/makeflow`;

    let powerAppConfig = this.config.makeflow.powerApp;

    return {
      name: powerAppConfig.name,
      // TODO: Custom version by user
      version: makeflowInfo.powerAppVersion,
      displayName: powerAppConfig.displayName,
      description: powerAppConfig.description,
      hookBaseURL,
      configs: [
        {
          field: 'password',
          name: 'token' as PowerAppConfig.Name,
          displayName: '用于执行 Gateway 命令的 Token',
          required: true,
        },
      ],
      contributions: {
        powerItems: scriptsDefinition
          ? convertCommandConfigsToPowerItemDefinitions(
              scriptsDefinition.scripts,
              this.config.agents.map(agent => agent.namespace),
            )
          : [],
      },
    };
  }

  private async increasePowerAppVersion(): Promise<void> {
    let makeflowInfo = this.dbService.db.get('makeflow').value();

    let newVersion = semver.inc(makeflowInfo.powerAppVersion, 'patch');

    await this.dbService.db
      .get('makeflow')
      .assign({powerAppVersion: newVersion})
      .write();
  }

  private async requestAPI<TData>(
    path: string,
    body: Dict<unknown>,
    toAuth: boolean,
  ): Promise<TData> {
    let loginToken = this.dbService.db.get('makeflow').value().loginToken;

    if (toAuth && !loginToken) {
      throw new ExpectedError('MAKEFLOW_LOGGING_IN_REQUIRED');
    }

    let response = await fetch(
      `${this.config.makeflow.baseURL}/api/v1${path}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...(toAuth ? {'X-Access-Token': loginToken!} : undefined),
        },
      },
    );

    let result = await response.json();

    if ('error' in result) {
      let error = result.error;

      if (error.code === 'PERMISSION_DENIED') {
        // TODO: Update login info
      }

      throw new ExpectedError(error.code, error.message);
    } else {
      return result.data as TData;
    }
  }
}

function convertCommandConfigsToPowerItemDefinitions(
  scriptDefinitions: ScriptDefinition[],
  namespaces: string[],
): PowerItem.Definition[] {
  let toLabelNamespace = namespaces.length > 1;

  return scriptDefinitions
    .map(
      ({name, displayName = name, parameters = []}): PowerItem.Definition[] => {
        return namespaces.map(
          (namespace): PowerItem.Definition => {
            return {
              name: convertScriptNameToActionName(
                namespace,
                name,
              ) as PowerItem.Name,
              displayName: toLabelNamespace
                ? `[${namespace}] ${displayName}`
                : displayName,
              fields: compact(
                parameters.map(parameter =>
                  convertCommandConfigParameterToPowerItemField(parameter),
                ),
              ),
              inputs: [
                {
                  name: TASK_NUMERIC_ID_INPUT_NAME,
                  displayName: 'Task Numeric Id',
                  bind: {
                    type: 'variable',
                    variable: TASK_NUMERIC_ID_VARIABLE,
                  },
                },
                {
                  name: TASK_BRIEF_INPUT_NAME,
                  displayName: 'Task Brief',
                  bind: {
                    type: 'variable',
                    variable: TASK_BRIEF_VARIABLE,
                  },
                },
                {
                  name: TASK_ASSIGNEE_INPUT_NAME,
                  displayName: 'Task Assignee',
                  bind: {
                    type: 'variable',
                    variable: TASK_ASSIGNEE_VARIABLE,
                  },
                },
                {
                  name: TASK_URL_INPUT_NAME,
                  displayName: 'Task URL',
                  bind: {
                    type: 'variable',
                    variable: TASK_URL_VARIABLE,
                  },
                },
                ...parameters.map(parameter =>
                  convertCommandConfigParamaterToPowerItemActionInput(
                    parameter,
                  ),
                ),
              ],
              actions: [
                {
                  name: name as PowerItem.ActionName,
                  displayName: '执行命令',
                },
              ],
            };
          },
        );
      },
    )
    .flatMap(definitions => definitions);
}

function convertCommandConfigParamaterToPowerItemActionInput(
  parameter: ScriptDefinitionParameter,
): PowerAppInput.Definition {
  let [name, displayName] = getNameAndDisplayNameOfParameter(parameter);

  return {
    displayName,
    name: name as PowerAppInput.Name,
    default: {
      type: 'variable',
      variable: name,
    },
  };
}

function convertCommandConfigParameterToPowerItemField(
  parameter: ScriptDefinitionParameter,
): PowerItem.PowerItemFieldDefinition | undefined {
  // TODO: as?
  let field = typeof parameter === 'object' ? parameter.field : undefined;

  if (!field) {
    return undefined;
  }

  let [name, displayName] = getNameAndDisplayNameOfParameter(parameter);

  return {
    id: name as PowerItem.PowerItemFieldId,
    type: field.type,
    output: name,
    displayName,
    data: field.data,
  };
}

function getNameAndDisplayNameOfParameter(
  parameter: ScriptDefinitionParameter,
): [string, string] {
  let name: string;
  let displayName: string;

  if (typeof parameter === 'string') {
    name = parameter;
    displayName = parameter;
  } else {
    name = parameter.name;
    displayName = parameter.displayName ?? name;
  }

  return [name, displayName];
}

function compact<T>(list: (T | undefined)[]): T[] {
  return list.filter((item): item is T => !!item);
}

function convertScriptNameToActionName(
  namespace: string,
  name: string,
): string {
  return `${namespace}:${name}`;
}

function convertActionNameToScriptName(
  actionName: string,
): {namespace: string; name: string} {
  let [namespace, ...nameFragments] = actionName.split(':');

  return {
    namespace,
    name: nameFragments.join(':'),
  };
}
