import * as FS from 'fs';
import * as Path from 'path';

import sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
  SQLITEScriptDefinition,
} from '../types';

export interface SqliteAdapterOptions {
  path: string;
}

export class SqliteAdapter
  implements IAdapter<SQLITEScriptDefinition, SqliteAdapterOptions> {
  type = 'sqlite' as const;

  async runScript({
    cwd,
    definition,
    parameters,
    options,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
  }: AdapterRunScriptArgument<
    SQLITEScriptDefinition,
    SqliteAdapterOptions
  >): Promise<AdapterRunScriptResult> {
    try {
      if (!options || !options.path) {
        return {
          result: 'options-error',
          message: 'The "path" field is not found in options.',
        };
      }

      let db = await sqlite.open({
        filename: options.path,
        driver: sqlite3.Database,
      });

      let buffer = await FS.promises.readFile(Path.join(cwd, definition.file));

      let result = await db.run(buffer.toString(), {
        $resource_path: resourcePath,
        $resource_base_url: resourceBaseURL,
        ...Object.fromEntries(
          Object.entries(parameters).map(([key, value]) => [`$${key}`, value]),
        ),
      });

      onOutput(
        `本次执行影响了 ${result.changes} 条数据, 最后一条数据 Id 为 ${result.lastID}`,
      );

      return {
        result: 'done',
        message: '',
      };
    } catch (error) {
      return {result: 'unknown-error', message: error.message || String(error)};
    }
  }
}
