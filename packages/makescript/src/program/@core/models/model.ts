import {MakeflowInfoModal} from './makeflow';
import {RunningRecordModel} from './running-record';
import {TokenModel} from './token';

export const MODEL_VERSION = 1;

export interface Model {
  version: number;
  makeflow: MakeflowInfoModal;
  initialized: boolean;
  passwordHash: string | undefined;
  tokens: TokenModel[];
  records: RunningRecordModel[];
}
