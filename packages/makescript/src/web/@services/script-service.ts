import {BriefScriptDefinition} from '@makeflow/makescript-agent';
import {observable} from 'mobx';
import {Dict} from 'tslang';

import {RunningRecord} from '../../program/types';
import {fetchAPI} from '../@helpers';

export interface AgentsStatus {
  joinLink: string;
  registeredAgents: {
    namespace: string;
    scriptQuantity: number;
  }[];
}

export class ScriptsService {
  @observable
  runningRecords: RunningRecord[] = [];

  getRunningRecord(id: string): RunningRecord | undefined {
    return this.runningRecords.find(item => item.id === id);
  }

  async fetchScriptDefinitionsMap(): Promise<{
    scriptsMap: Map<string, BriefScriptDefinition[]>;
    baseURL: string;
  }> {
    let {definitionsDict, url} = await fetchAPI('/api/scripts');

    return {
      scriptsMap: new Map(Object.entries(definitionsDict)),
      baseURL: url,
    };
  }

  async fetchRunningRecords(): Promise<void> {
    let {records} = await fetchAPI('/api/scripts/running-records');

    this.runningRecords = records;
  }

  async fetchStatus(): Promise<AgentsStatus> {
    return fetchAPI('/api/status');
  }

  async runScriptFromRecords(
    id: string,
    password: string | undefined,
  ): Promise<void> {
    await fetchAPI('/api/records/run', {
      method: 'POST',
      body: JSON.stringify({id, password}),
    });

    await this.fetchRunningRecords();
  }

  async runScriptDirectly(options: {
    namespace: string;
    name: string;
    parameters: Dict<unknown>;
    password: string | undefined;
  }): Promise<void> {
    await fetchAPI('/api/scripts/run', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}
