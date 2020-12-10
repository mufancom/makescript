import {ScriptRunningArgumentParameters} from '@makeflow/makescript-agent';
import {v4 as uuidv4} from 'uuid';

import {RunningRecordModel, RunningRecordModelMakeflowInfo} from '../@core';
import {RunningRecord, RunningRecordMakeflowInfo} from '../types';

import {DBService} from './db-service';

export class RecordService {
  get runningRecords(): RunningRecord[] {
    let runningRecordModels = this.dbService.db.get('records').value();

    return runningRecordModels.map(model => convertRecordModelToRecord(model));
  }

  constructor(private dbService: DBService) {}

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
  }): Promise<string> {
    // TODO: Filter parameters
    let insertedRecords = await this.dbService.db
      .get('records')
      .unshift({
        id: uuidv4(),
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

    return insertedRecords[0].id;
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
