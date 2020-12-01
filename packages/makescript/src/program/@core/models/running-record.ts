import {RunningRecord, RunningRecordMakeflowInfo} from '../../types';

export interface RunningRecordModel extends RunningRecord {
  makeflow: RunningRecordModelMakeflowInfo | undefined;
}

export interface RunningRecordModelMakeflowInfo
  extends RunningRecordMakeflowInfo {
  powerItemToken: string;
}
