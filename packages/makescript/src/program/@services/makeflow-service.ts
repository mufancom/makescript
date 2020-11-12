import fetch from 'node-fetch';
import type {Dict} from 'tslang';

import {ExpectedError} from '../@core';
import {Config} from '../config';
import {MFUserCandidate} from '../types/makeflow';

import {DBService} from './db-service';

export class MakeflowService {
  constructor(private dbService: DBService, private config: Config) {}

  async listUserCandidates(
    username: string,
    password: string,
  ): Promise<MFUserCandidate> {
    return this.requestAPI('/account/list-users', {
      mobile: username,
      password,
    });
  }

  async authenticate(
    username: string,
    password: string,
    userId: string,
  ): Promise<void> {
    let token = await this.requestAPI('/access-token/create', {
      mobile: username,
      password,
      user: userId,
      permissions: [],
    });

    await this.dbService.db.get('makeflow').set('loginToken', token).write();
  }

  private async requestAPI<TData>(
    path: string,
    body?: Dict<unknown>,
  ): Promise<TData> {
    let response = await fetch(
      `${this.config.makeflow.baseURL}/api/v1${path}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
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
