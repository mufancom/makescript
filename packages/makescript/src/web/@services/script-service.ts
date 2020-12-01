import {ScriptDefinition, ScriptsDefinition} from '@makeflow/makescript-agent';
import {computed, observable} from 'mobx';

import {RunningRecord} from '../../program/types';
import {fetchAPI} from '../@helpers';

export class ScriptService {
  @observable
  private _scriptsRepoURL: string | undefined;

  @observable
  private _scriptsDefinition: ScriptsDefinition | undefined;

  @observable
  private _runningRecords: RunningRecord[] = [];

  @computed
  get scriptsRepoURL(): string | undefined {
    return this._scriptsRepoURL;
  }

  @computed
  get runningRecords(): RunningRecord[] {
    return this._runningRecords;
  }

  @computed
  get scriptDefinitions(): ScriptDefinition[] {
    return this._scriptsDefinition?.scripts ?? [];
  }

  getRunningRecord(id: string): RunningRecord | undefined {
    return this.runningRecords.find(item => item.id === id);
  }

  async fetchScriptsRepoURL(): Promise<void> {
    let {url} = await fetchAPI('/api/scripts/repo-url');

    this._scriptsRepoURL = url;
  }

  async updateScriptsRepoURL(url: string): Promise<void> {
    await fetchAPI('/api/scripts/repo-url/update', {
      method: 'POST',
      body: JSON.stringify({url}),
    });
  }

  async updateScripts(): Promise<void> {
    await fetchAPI('/api/scripts/update', {method: 'POST'});
  }

  async fetchScriptsDefinition(): Promise<void> {
    let {definition} = await fetchAPI('/api/scripts');

    console.log('fetchScriptsDefinition: ', definition);

    this._scriptsDefinition = definition;
  }

  async fetchRunningRecords(): Promise<void> {
    let {records} = await fetchAPI('/api/scripts/running-records');

    this._runningRecords = records;
  }
}
