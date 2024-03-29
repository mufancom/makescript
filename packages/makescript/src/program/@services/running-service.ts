import {EventEmitter} from 'events';

import {
  ScriptRunningArgumentParameters,
  logger,
} from '@makeflow/makescript-agent';
import {v4 as uuidv4} from 'uuid';

import {
  ExpectedError,
  RunningRecordModel,
  RunningRecordModelMakeflowInfo,
} from '../@core';
import {Config} from '../config';
import {RunningRecord, RunningRecordMakeflowInfo} from '../types';

import {AgentService} from './agent-service';
import {DBService} from './db-service';

export class RunningService {
  get runningRecords(): RunningRecord[] {
    let runningRecordModels = this.dbService.db.get('records').value();

    return runningRecordModels.map(model => convertRecordModelToRecord(model));
  }

  constructor(
    private agentService: AgentService,
    private dbService: DBService,
    private eventEmitter: EventEmitter,
    private config: Config,
  ) {}

  async runScriptDirectly({
    namespace,
    name,
    parameters,
    password,
  }: {
    namespace: string;
    name: string;
    parameters: ScriptRunningArgumentParameters;
    password: string | undefined;
  }): Promise<void> {
    let recordId = await this.enqueueRunningRecord({
      namespace,
      name,
      parameters,
      triggerTokenLabel: undefined,
      makeflowTask: undefined,
      tryToRun: false,
    });

    await this.runScriptFromRecords(recordId, password);
  }

  async enqueueRunningRecord({
    namespace,
    name,
    parameters,
    triggerTokenLabel,
    makeflowTask,
    tryToRun = true,
  }: {
    namespace: string;
    name: string;
    parameters: ScriptRunningArgumentParameters;
    triggerTokenLabel: string | undefined;
    makeflowTask: RunningRecordModelMakeflowInfo | undefined;
    tryToRun?: boolean;
  }): Promise<string> {
    let definition = await this.agentService.requireScriptDefinition(
      namespace,
      name,
    );

    let recordId = uuidv4();

    await this.dbService.db
      .get('records')
      .unshift({
        id: recordId,
        namespace,
        name,
        parameters,
        deniedParameters: {},
        triggerTokenLabel,
        makeflow: makeflowTask,
        result: undefined,
        output: undefined,
        createdAt: Date.now(),
        ranAt: undefined,
      })
      .write();

    if (definition.hooks.postscript) {
      try {
        await this.agentService.registeredRPCMap
          .get(namespace)
          ?.triggerHook(name, 'postscript');
      } catch (error) {
        logger.error(
          `Error to trigger hook "postscript" for script "${name}": ${error.message}`,
        );
      }
    }

    if (tryToRun && !definition.manual && !definition.needsPassword) {
      await this.runScriptFromRecords(recordId, undefined);
    }

    return recordId;
  }

  async runScriptFromRecords(
    id: string,
    password: string | undefined,
  ): Promise<void> {
    let record = this.dbService.db.get('records').find({id}).value();

    if (!record) {
      throw new ExpectedError('SCRIPT_RUNNING_RECORD_NOT_FOUND');
    }

    let resourcesBaseURL = `${this.config.url}/resources/${id}`;

    let runningResult = await this.agentService.runScript(record.namespace, {
      id: record.id,
      name: record.name,
      parameters: record.parameters,
      resourcesBaseURL,
      password,
    });

    let {parameters, deniedParameters, result, output} = runningResult;

    await this.dbService.db
      .get('records')
      .find({id})
      .assign({
        parameters,
        deniedParameters,
        result,
        output,
        ranAt: Date.now(),
      })
      .write();

    this.eventEmitter.emit('script-running-completed', {id});
  }
}

function convertRecordModelToRecord(
  recordModel: RunningRecordModel,
): RunningRecord {
  let {makeflow, ...rest} = recordModel;

  let convertedMakeflow: RunningRecordMakeflowInfo | undefined;

  if (makeflow) {
    let {powerItemToken, ...restMakeflow} = makeflow;

    convertedMakeflow = restMakeflow;
  }

  return {
    ...rest,
    makeflow: convertedMakeflow,
  };
}
