import {MakeflowInfoModal} from './makeflow';
import {RunningRecordModel} from './running-record';
import {SettingsModel} from './settings';
import {TokenModel} from './token';
import {UserModel} from './user';

export interface Model {
  version: number;
  makeflow: MakeflowInfoModal;
  settings: SettingsModel;
  users: UserModel[];
  tokens: TokenModel[];
  records: RunningRecordModel[];
}
