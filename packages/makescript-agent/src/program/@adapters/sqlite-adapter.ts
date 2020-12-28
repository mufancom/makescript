import * as FS from 'fs';
import * as Path from 'path';

import sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

import {
  AdapterRunScriptArgument,
  AdapterRunScriptResult,
  IAdapter,
} from '../types';

declare global {
  namespace MakeScript {
    namespace Adapter {
      interface AdapterOptionsDict {
        sqlite: {
          file: string;
          db:
            | {
                path: string;
                password?: string;
              }
            | string;
        };
      }
    }
  }
}

export class SqliteAdapter
  implements
    IAdapter<
      Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'sqlite'}>
    > {
  type = 'sqlite' as const;

  async runScript({
    cwd,
    definition,
    parameters,
    resourcesPath: resourcePath,
    resourcesBaseURL: resourceBaseURL,
    onOutput,
  }: AdapterRunScriptArgument<
    Extract<MakeScript.Adapter.AdapterScriptDefinition, {type: 'sqlite'}>
  >): Promise<AdapterRunScriptResult> {
    try {
      let dbPath =
        typeof definition.db === 'string' ? definition.db : definition.db.path;

      if (!dbPath) {
        return {
          ok: false,
          message: 'The "db" field is not found in definition.',
        };
      }

      let db = await sqlite.open({
        filename: dbPath,
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
        ok: true,
        message: '',
      };
    } catch (error) {
      return {ok: false, message: error.message || String(error)};
    }
  }
}
