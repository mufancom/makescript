import {ExpectedError} from '../@core';
import {Config} from '../config';

import {AgentService} from './agent-service';
import {DBService} from './db-service';
import {MakeflowService} from './makeflow-service';

export class RunningService {
  constructor(
    private agentService: AgentService,
    private makeflowService: MakeflowService,
    private dbService: DBService,
    private config: Config,
  ) {}

  async runScript(id: string): Promise<void> {
    let record = this.dbService.db.get('records').find({id}).value();

    if (!record) {
      throw new ExpectedError('SCRIPT_RUNNING_RECORD_NOT_FOUND');
    }

    let resourcesBaseURL = `${this.config.webAdmin.url}/resources/${id}`;

    let runningResult = await this.agentService.runScript(record.namespace, {
      id: record.id,
      name: record.name,
      parameters: record.parameters,
      resourcesBaseURL,
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

    await this.makeflowService.updatePowerItem({
      id,
      stage: 'done',
      description: undefined,
      outputs: undefined,
    });
  }
}
