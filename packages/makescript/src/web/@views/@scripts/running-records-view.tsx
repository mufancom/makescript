import {ArrowLeftOutlined, SettingOutlined} from '@ant-design/icons';
import {Empty, Tooltip} from 'antd';
import {Route, RouteComponentProps} from 'boring-router-react';
import classNames from 'classnames';
import memorize from 'memorize-decorator';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, MouseEventHandler, ReactNode} from 'react';
import styled from 'styled-components';

import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

import {
  EmptyPanel,
  NotSelectedPanel,
  ScriptBriefItem,
  ScriptList,
  ScriptListContent,
  ScriptListLabel,
  Wrapper,
} from './@common';
import {RunningRecordViewerView} from './@running-record-viewer-view';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

type CommandsHistoryMatch = Router['scripts']['records'];

const ActionButton = styled.div`
  cursor: pointer;
`;

const ScriptBriefItemNamespace = styled.div`
  color: #888;
`;

const ScriptBriefItemName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

export interface RunningRecordsViewProps
  extends RouteComponentProps<CommandsHistoryMatch> {}

@observer
export class RunningRecordsView extends Component<RunningRecordsViewProps> {
  @computed
  private get activeRecordId(): string | undefined {
    let {
      match: {recordId: recordIdMatch},
    } = this.props;

    if (!recordIdMatch.$matched) {
      return undefined;
    }

    return recordIdMatch.$params.recordId;
  }

  @computed
  private get toShowNamespaceInList(): boolean {
    return (
      new Set(
        ENTRANCES.scriptService.runningRecords.map(record => record.namespace),
      ).size > 1
    );
  }

  @computed
  private get recordsRendering(): ReactNode {
    let runningRecords = ENTRANCES.scriptService.runningRecords;

    if (!runningRecords.length) {
      return (
        <EmptyPanel>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </EmptyPanel>
      );
    }

    let activeId = this.activeRecordId;

    return (
      <ScriptListContent>
        {runningRecords.map(({id, namespace, name, ranAt, output}) => {
          let notExecuted = !ranAt;
          let hasError = !!output?.error;

          let tooltipMessage = '';

          if (notExecuted) {
            tooltipMessage = '该脚本暂未执行';
          }

          if (hasError) {
            tooltipMessage = '执行结果有错误';
          }

          return (
            <Tooltip
              key={id}
              placement="right"
              title={tooltipMessage}
              mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
            >
              <ScriptBriefItem
                className={classNames({
                  active: id === activeId,
                  highlight: notExecuted,
                  error: hasError,
                })}
                onClick={this.getOnRunningRecordClick(id)}
              >
                {this.toShowNamespaceInList ? (
                  <ScriptBriefItemNamespace>
                    {namespace}
                  </ScriptBriefItemNamespace>
                ) : undefined}
                {/* TODO: Display name ? */}
                <ScriptBriefItemName>{name}</ScriptBriefItemName>
              </ScriptBriefItem>
            </Tooltip>
          );
        })}
      </ScriptListContent>
    );
  }

  @computed
  private get notSelectedPanelRendering(): ReactNode {
    let recordSelected = this.props.match.recordId.$matched;

    if (recordSelected) {
      return undefined;
    }

    return (
      <NotSelectedPanel>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请在列表中选择一个记录来展示详情"
        />
      </NotSelectedPanel>
    );
  }

  render(): ReactNode {
    let {match} = this.props;

    return (
      <Wrapper>
        <ScriptList>
          <ScriptListLabel>
            <ActionButton
              data-title="返回脚本执行记录"
              onClick={this.onBackButtonClick}
            >
              <ArrowLeftOutlined />
            </ActionButton>
            脚本执行记录
            <Tooltip
              title="可执行脚本列表"
              mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
            >
              <ActionButton onClick={this.onManageButtonClick}>
                <SettingOutlined />
              </ActionButton>
            </Tooltip>
          </ScriptListLabel>
          {this.recordsRendering}
        </ScriptList>
        <Route match={match.recordId} component={RunningRecordViewerView} />
        {this.notSelectedPanelRendering}
      </Wrapper>
    );
  }

  private onBackButtonClick = (): void => {
    route.$push();
  };

  private onManageButtonClick = (): void => {
    route.scripts.management.$push();
  };

  @memorize()
  private getOnRunningRecordClick(id: string): MouseEventHandler {
    return () => {
      let {match} = this.props;

      match.recordId.$push({recordId: id});
    };
  }
}
