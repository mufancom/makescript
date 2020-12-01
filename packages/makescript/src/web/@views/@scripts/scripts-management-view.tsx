import {ArrowLeftOutlined} from '@ant-design/icons';
import {Button, Empty, Input, Modal, message} from 'antd';
import {Route, RouteComponentProps} from 'boring-router-react';
import classNames from 'classnames';
import memorize from 'memorize-decorator';
import {action, computed, observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {
  ChangeEvent,
  Component,
  MouseEventHandler,
  ReactNode,
} from 'react';
import styled from 'styled-components';

import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

import {
  EmptyPanel,
  NotSelectedPanel,
  ScriptBriefItem,
  ScriptList,
  ScriptListLabel,
  ScriptType,
  Wrapper,
} from './@common';
import {ScriptDefinitionViewerView} from './@script-definition-viewer-view';

type ScriptsManagementMatch = Router['scripts']['management'];

const BriefItem = styled(ScriptBriefItem)`
  flex-direction: column;
  align-items: flex-start;
`;

const ScriptName = styled.div`
  color: #666;
  font-size: 0.8em;
  margin-top: 5px;
`;

const BackButton = styled.div`
  cursor: pointer;
`;

const ViewerPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SyncConfigBar = styled.div`
  padding: 10px;
  display: flex;
  justify-content: space-between;
  background-color: hsl(0, 0%, 100%);
  margin-bottom: 20px;
  border-radius: 2px;
  box-shadow: hsl(0, 0%, 0%, 0.08) 0 2px 4px 0;

  .sync-button {
    margin-left: 10px;
  }
`;

export interface ScriptsManagementViewProps
  extends RouteComponentProps<ScriptsManagementMatch> {}

@observer
export class ScriptsManagementView extends Component<
  ScriptsManagementViewProps
> {
  @observable
  private scriptsRepoURL = ENTRANCES.scriptsService.scriptsRepoURL;

  @observable
  private syncButtonPending = false;

  @computed
  private get activeScriptName(): string | undefined {
    let {
      match: {scriptName: scriptNameMatch},
    } = this.props;

    if (!scriptNameMatch.$matched) {
      return undefined;
    }

    return scriptNameMatch.$params.scriptName;
  }

  @computed
  private get scriptsRepoURLChanged(): boolean {
    return this.scriptsRepoURL !== ENTRANCES.scriptsService.scriptsRepoURL;
  }

  @computed
  private get scriptsListRendering(): ReactNode {
    let scriptDefinitions = ENTRANCES.scriptsService.scriptDefinitions;

    if (!scriptDefinitions.length) {
      return (
        <EmptyPanel>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </EmptyPanel>
      );
    }

    let activeName = this.activeScriptName;

    return scriptDefinitions.map(({type, name, displayName}) => (
      <BriefItem
        key={name}
        className={classNames({active: name === activeName})}
        onClick={this.getOnScriptItemClick(name)}
      >
        <ScriptType>{type}</ScriptType>
        {displayName}
        <ScriptName>({name})</ScriptName>
      </BriefItem>
    ));
  }

  @computed
  private get notSelectedPanelRendering(): ReactNode {
    let commandSelected = this.props.match.scriptName.$matched;

    if (commandSelected) {
      return undefined;
    }

    return (
      <NotSelectedPanel>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请在列表中选择一个脚本以查看"
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
            <BackButton
              data-title="返回执行记录"
              onClick={this.onBackButtonClick}
            >
              <ArrowLeftOutlined />
            </BackButton>
            脚本列表
          </ScriptListLabel>
          {this.scriptsListRendering}
        </ScriptList>
        <ViewerPanel>
          <SyncConfigBar>
            <Input
              value={this.scriptsRepoURL}
              onChange={this.onConfigURLChange}
            />
            <Button
              className="sync-button"
              type="primary"
              loading={this.syncButtonPending}
              disabled={this.syncButtonPending}
              onClick={this.onSyncConfigButtonClick}
            >
              {this.scriptsRepoURLChanged ? '更新地址' : '同步配置'}
            </Button>
          </SyncConfigBar>
          <Route
            match={match.scriptName}
            component={ScriptDefinitionViewerView}
          />
          {this.notSelectedPanelRendering}
        </ViewerPanel>
      </Wrapper>
    );
  }

  componentDidMount(): void {
    let scriptService = ENTRANCES.scriptsService;

    scriptService
      .fetchScriptsRepoURL()
      .then(() => {
        this.setConfigURL(scriptService.scriptsRepoURL);
      })
      .catch(console.error);
  }

  private onBackButtonClick = (): void => {
    route.scripts.records.$push();
  };

  private onConfigURLChange = ({
    currentTarget: {value},
  }: ChangeEvent<HTMLInputElement>): void => {
    this.setConfigURL(value);
  };

  private onSyncConfigButtonClick = async (): Promise<void> => {
    this.setSyncButtonPending(true);

    let scriptService = ENTRANCES.scriptsService;

    if (this.scriptsRepoURLChanged) {
      if (!scriptService.scriptsRepoURL) {
        await this.updateCommandsConfigURL();
      } else {
        Modal.confirm({
          title: '确认更新',
          content: '更新配置地址可能导致之前的任务无法执行, 是否继续?',
          onOk: this.onSyncScriptsRepoURLModalConfirm,
          onCancel: () => {
            this.setSyncButtonPending(false);
          },
        });
      }
    } else {
      await scriptService.updateScripts();
      this.setSyncButtonPending(false);
      await message.success('同步成功');
    }
  };

  private onSyncScriptsRepoURLModalConfirm = async (): Promise<void> => {
    await this.updateCommandsConfigURL();
  };

  @memorize()
  private getOnScriptItemClick(name: string): MouseEventHandler {
    return () => {
      let {match} = this.props;

      match.scriptName.$push({scriptName: name});
    };
  }

  private async updateCommandsConfigURL(): Promise<void> {
    let configURL = this.scriptsRepoURL;

    if (!configURL) {
      return;
    }

    await ENTRANCES.scriptsService.updateScriptsRepoURL(configURL);
    this.setSyncButtonPending(false);
    await message.success('更新成功');
  }

  @action
  private setConfigURL(url: string | undefined): void {
    this.scriptsRepoURL = url;
  }

  @action
  private setSyncButtonPending(pending: boolean): void {
    this.syncButtonPending = pending;
  }
}
