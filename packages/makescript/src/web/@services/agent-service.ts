import {ScriptDefinition} from '@makeflow/makescript-agent';
import {observable} from 'mobx';

import {RunningRecord} from '../../program/types';
import {fetchAPI} from '../@helpers';

export class AgentService {
  @observable
  scriptDefinitionsMap = new Map<string, ScriptDefinition[]>();

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

  async fetchScriptsDefinition(): Promise<void> {
    let {definitionsDict} = await fetchAPI('/api/scripts');

    this.scriptDefinitionsMap = new Map(Object.entries(definitionsDict));
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

  async runScript(id: string): Promise<void> {
    await fetchAPI('/api/records/run', {
      method: 'POST',
      body: JSON.stringify({id}),
    });

    await this.fetchRunningRecords();
  }
}
