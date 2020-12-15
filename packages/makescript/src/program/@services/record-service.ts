import {
  ScriptRunningArgumentParameters,
  logger,
} from '@makeflow/makescript-agent';
import {v4 as uuidv4} from 'uuid';

import {RunningRecordModel, RunningRecordModelMakeflowInfo} from '../@core';
import {RunningRecord, RunningRecordMakeflowInfo} from '../types';

import {AgentService} from './agent-service';
import {DBService} from './db-service';
import {RunningService} from './running-service';

export class RecordService {
  get runningRecords(): RunningRecord[] {
    let runningRecordModels = this.dbService.db.get('records').value();

    return runningRecordModels.map(model => convertRecordModelToRecord(model));
  }

  constructor(
    private agentService: AgentService,
    private runningService: RunningService,
    private dbService: DBService,
  ) {}

  async enqueueRunningRecord({
    namespace,
    name,
    parameters,
    triggerTokenLabel,
    makeflowTask,
  }: {
    namespace: string;
    name: string;
    parameters: ScriptRunningArgumentParameters;
    triggerTokenLabel: string;
    makeflowTask: RunningRecordModelMakeflowInfo | undefined;
  }): Promise<void> {
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

    try {
      await this.agentService.registeredRPCMap
        .get(namespace)
        ?.triggerHook(name, 'postTrigger');
    } catch (error) {
      logger.error(
        `Error to trigger hook "postTrigger" for script "${name}": ${error.message}`,
      );
    }

    if (!definition.manual && !definition.needsPassword) {
      await this.runningService.runScript(recordId, undefined);
    }
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
