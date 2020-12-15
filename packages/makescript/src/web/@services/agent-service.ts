import {BriefScriptDefinition} from '@makeflow/makescript-agent';
import {observable} from 'mobx';

import {RunningRecord} from '../../program/types';
import {fetchAPI} from '../@helpers';

export class AgentService {
  @observable
  runningRecords: RunningRecord[] = [];

  @observable
  status:
    | {
        joinLink: string;
        registeredAgents: {namespace: string; scriptQuantity: number}[];
      }
    | undefined;

  getRunningRecord(id: string): RunningRecord | undefined {
    return this.runningRecords.find(item => item.id === id);
  }

  async fetchScriptDefinitionsMap(): Promise<
    Map<string, BriefScriptDefinition[]>
  > {
    let {definitionsDict} = await fetchAPI('/api/scripts');

    return new Map(Object.entries(definitionsDict));
  }

  async fetchRunningRecords(): Promise<void> {
    let {records} = await fetchAPI('/api/scripts/running-records');

    this.runningRecords = records;
  }

  async fetchStatus(): Promise<void> {
    let {joinLink, registeredAgents} = await fetchAPI('/api/status');

    this.status = {
      joinLink,
      registeredAgents,
    };
  }

  async runScript(id: string, password: string | undefined): Promise<void> {
    await fetchAPI('/api/records/run', {
      method: 'POST',
      body: JSON.stringify({id, password}),
    });

    await this.fetchRunningRecords();
  }
}
