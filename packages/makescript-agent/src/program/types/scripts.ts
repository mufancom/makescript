export interface ScriptsSyncResult {
  result: ScriptsSyncResultType;
  message: string;
}

export type ScriptsSyncResultType =
  | 'done'
  | 'unzip-failed'
  | 'scripts-definition-not-found'
  | 'scripts-definition-parse-error'
  | 'initialize-failed'
  | 'unknown-error';
