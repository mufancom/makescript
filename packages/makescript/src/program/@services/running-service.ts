import {ScriptRunningArgumentParameter} from '@makeflow/makescript-agent';
import {v4 as uuidv4} from 'uuid';

import {ExpectedError, RunningRecordMakeflowTask} from '../@core';
import {Config} from '../config';

import {AgentService} from './agent-service';
import {DBService} from './db-service';

export class RunningService {
  constructor(
    private agentService: AgentService,
    private dbService: DBService,
    private config: Config,
  ) {}

  async enqueueRunningRecord({
    namespace,
    name,
    parameters,
    triggerToken,
    makeflowTask,
  }: {
    namespace: string;
    name: string;
    parameters: ScriptRunningArgumentParameter[];
    triggerToken: string;
    makeflowTask: RunningRecordMakeflowTask | undefined;
  }): Promise<string> {
    let insertedRecords = await this.dbService.db
      .get('records')
      .unshift({
        id: uuidv4(),
        namespace,
        name,
        parameters,
        triggerToken,
        makeflowTask,
        result: undefined,
        createdAt: Date.now(),
        ranAt: undefined,
      })
      .write();

    return insertedRecords[0].id;
  }

  async runScript(id: string): Promise<void> {
    let record = this.dbService.db.get('records').find({id}).value();

    if (!record) {
      throw new ExpectedError('SCRIPT_RUNNING_RECORD_NOT_FOUND');
    }

    let resourcesBaseURL = `${this.config.api.url}/resources/${id}`;

    let result = await this.agentService.runScript(record.namespace, {
      id: record.id,
      name: record.name,
      parameters: record.parameters,
      resourcesBaseURL,
      hostURL: this.config.api.url,
    });

    await this.dbService.db.get('records').find({id}).assign({result}).write();
  }
}
