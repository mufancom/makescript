import * as Path from 'path';

import Lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

import {MODEL_VERSION, Model} from '../@core';
import {Config} from '../config';

const DB_FILE_NAME = 'db.json';

const DB_MODEL_DEFAULT: Model = {
  version: MODEL_VERSION,
  makeflow: {
    loginToken: undefined,
    powerAppVersion: '0.1.0',
  },
  initialized: false,
  passwordHash: undefined,
  tokens: [],
  records: [],
};

export class DBService {
  readonly ready: Promise<void>;

  readonly db!: Lowdb.LowdbAsync<Model>;

  constructor(private config: Config) {
    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    // Assign 'this.db' only while initialization
    (this.db as any) = await Lowdb(
      new FileAsync<Model>(Path.join(this.config.workspace, DB_FILE_NAME)),
    );

    await this.db.defaults(DB_MODEL_DEFAULT).write();
  }
}
