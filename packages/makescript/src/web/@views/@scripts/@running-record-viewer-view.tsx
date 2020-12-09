import {CaretRightFilled, RedoOutlined} from '@ant-design/icons';
import {Modal, Tooltip, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {RunningRecord} from '../../../program/types';
import {ENTRANCES} from '../../@constants';
import {Router} from '../../@routes';

import {DictContent, ExecuteButton, Item, Label, Title} from './@common';
import {OutputPanel} from './@output-panel';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

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

    return ENTRANCES.agentService.getRunningRecord(recordId);
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
        {error && <OutputPanel type="error" label="错误" output={error} />}
        {output && <OutputPanel type="info" label="输出" output={output} />}
      </>
    );
  }

  render(): ReactNode {
    let record = this.runningRecord;

    if (!record) {
      return <div>脚本未找到</div>;
    }

    let executionButtonTitle = record.ranAt ? '重新执行该命令' : '执行该命令';
    let icon = record.ranAt ? <RedoOutlined /> : <CaretRightFilled />;

    return (
      <Wrapper>
        <Content>
          <Title>{record.name}</Title>
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

    Modal.confirm({
      title: '确认执行',
      content: confirmationMessage,
      onOk: async () => {
        try {
          await ENTRANCES.agentService.runScript(record!.id);
          await message.success('执行成功');
        } catch (error) {
          await message.error('执行失败');
        }
      },
    });
  };
}
