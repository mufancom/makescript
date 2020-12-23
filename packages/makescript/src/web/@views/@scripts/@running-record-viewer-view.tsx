import {CaretRightFilled, RedoOutlined} from '@ant-design/icons';
import {AdapterRunScriptResult} from '@makeflow/makescript-agent';
import {Input, Modal, Tooltip, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import {computed, observable} from 'mobx';
import {Observer, observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {RunningRecord} from '../../../program/types';
import {ENTRANCES} from '../../@constants';
import {Router} from '../../@routes';

import {DictContent, ExecuteButton, Item, Label, Title} from './@common';
import {OutputPanel} from './@output-panel';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

// TODO: Cannot import `OUTPUT_CLEAR_CHARACTER` from '@makeflow/makescript-agent' ?
const OUTPUT_CLEAR_CHARACTER = '\x1Bc';
const SHOWABLE_CLEAR_CHARACTER = '-- clear --';

const RESULT_DISPLAY_NAME_DICT: {
  [TKey in AdapterRunScriptResult['result']]: {
    color: string;
    displayName: string;
  };
} = {
  done: {color: 'green', displayName: '执行成功'},
  'options-error': {color: 'red', displayName: '脚本配置错误错误'},
  'parameters-error': {color: 'red', displayName: '脚本参数错误'},
  'unknown-error': {color: 'red', displayName: '未知错误'},
};

type RecordIdMatch = Router['scripts']['records']['recordId'];

const Wrapper = styled.div`
  flex: 1;
  position: relative;
  border-radius: 2px;
  background-color: #fff;
  box-shadow: hsla(0, 0%, 0%, 0.08) 0 2px 4px 0;
  overflow: hidden;
`;

const Content = styled.div`
  height: 100%;
  padding: 60px;
  overflow: auto;
`;

const PasswordInput = styled(Input)`
  margin-top: 10px;
`;

export interface RunningRecordViewerViewProps
  extends RouteComponentProps<RecordIdMatch> {}

@observer
export class RunningRecordViewerView extends Component<
  RunningRecordViewerViewProps
> {
  @computed
  private get runningRecord(): RunningRecord | undefined {
    let {
      match: {
        $params: {recordId},
      },
    } = this.props;

    return ENTRANCES.scriptService.getRunningRecord(recordId);
  }

  @computed
  private get runningOutputRendering(): ReactNode {
    let record = this.runningRecord;

    if (!record || !record.output) {
      return undefined;
    }

    let {output, error} = record.output;

    output = output?.trim();
    error = error?.trim();

    if (!output && !error) {
      return undefined;
    }

    return (
      <>
        <Label>脚本输出</Label>
        {error && (
          <OutputPanel
            type="error"
            label="错误"
            output={replaceClearCharacter(error)}
          />
        )}
        {output && (
          <OutputPanel
            type="info"
            label="输出"
            output={replaceClearCharacter(output)}
          />
        )}
      </>
    );
  }

  @computed
  private get runningResultRendering(): ReactNode {
    let record = this.runningRecord;

    if (!record || !record.result) {
      return;
    }

    let resultInfo = RESULT_DISPLAY_NAME_DICT[record.result.result];

    return (
      <>
        <Label>执行结果</Label>
        <Item style={{color: resultInfo.color}}>
          {resultInfo.displayName}
          {record.result.message ? `: ${record.result.message}` : undefined}
        </Item>
      </>
    );
  }

  @computed
  private get makeflowInfoRendering(): ReactNode {
    let record = this.runningRecord;

    if (!record || !record.makeflow) {
      return undefined;
    }

    return (
      <>
        <Label>触发用户（Makeflow）</Label>
        <Item>{record.makeflow.assignee.displayName}</Item>
        <Label>任务链接（Makeflow）</Label>
        <Item>
          <a href={record.makeflow.taskUrl} target="_blank">
            #{record.makeflow.numericId}: {record.makeflow.brief}
          </a>
        </Item>
      </>
    );
  }

  render(): ReactNode {
    let record = this.runningRecord;

    if (!record) {
      return <div>脚本未找到</div>;
    }

    let executionButtonTitle = record.ranAt ? '重新执行该脚本' : '执行该脚本';
    let icon = record.ranAt ? <RedoOutlined /> : <CaretRightFilled />;

    return (
      <Wrapper>
        <Content>
          <Title>
            {record.namespace} : {record.name}
          </Title>
          {this.makeflowInfoRendering}
          <Label>触发时间</Label>
          <Item>{new Date(record.createdAt).toLocaleString()}</Item>
          <Label>使用 Token</Label>
          <Item>{record.triggerTokenLabel ?? '未知 Token'}</Item>
          <Label>执行时间</Label>
          <Item>
            {record.ranAt
              ? new Date(record.ranAt).toLocaleString()
              : '尚未执行'}
          </Item>
          <DictContent label="执行参数" dict={record.parameters} />
          <DictContent label="被拒绝参数" dict={record.deniedParameters} />
          {this.runningOutputRendering}
          {this.runningResultRendering}
        </Content>

        <Tooltip
          title={executionButtonTitle}
          mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
        >
          <ExecuteButton onClick={this.onExecuteButtonClick}>
            {icon}
          </ExecuteButton>
        </Tooltip>
      </Wrapper>
    );
  }

  private onExecuteButtonClick = async (): Promise<void> => {
    let record = this.runningRecord;

    if (!record) {
      return;
    }

    let confirmationMessage: string;

    if (record.ranAt) {
      confirmationMessage = '是否再次以相同参数执行该脚本?';
    } else {
      confirmationMessage = '请确保已检查脚本参数';
    }

    let {
      scriptsMap,
    } = await ENTRANCES.scriptService.fetchScriptDefinitionsMap();

    let definition = scriptsMap
      .get(record.namespace)
      ?.find(definition => definition.name === record?.name);

    if (!definition) {
      void message.error(
        '未找到该记录所对应的脚本定义。请检查节点注册信息及对应节点的脚本列表。',
      );
      return;
    }

    let inputValueObservable = observable.box<string>(undefined);

    let modalContent: ReactNode;

    if (definition.needsPassword) {
      modalContent = (
        <Observer>
          {() => {
            return (
              <div>
                执行该脚本需要提供一个密码：
                <PasswordInput
                  value={inputValueObservable.get()}
                  placeholder="输入密码以执行脚本"
                  onChange={({currentTarget: {value}}) => {
                    inputValueObservable.set(value);
                  }}
                />
              </div>
            );
          }}
        </Observer>
      );
    } else {
      modalContent = confirmationMessage;
    }

    Modal.confirm({
      title: '确认执行',
      content: modalContent,
      okText: '执行',
      cancelText: '取消',
      onOk: async () => {
        try {
          await ENTRANCES.scriptService.runScriptFromRecords(
            record!.id,
            inputValueObservable.get(),
          );
          void message.success('执行成功');
        } catch (error) {
          void message.error('执行失败');
        }
      },
    });
  };
}

function replaceClearCharacter(text: string): string {
  return text.replace(OUTPUT_CLEAR_CHARACTER, SHOWABLE_CLEAR_CHARACTER);
}
