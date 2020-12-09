import {ArrowLeftOutlined} from '@ant-design/icons';
import {Empty} from 'antd';
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

const ScriptDefinitionsWrapper = styled.div``;

const Namespace = styled.div`
  font-size: 14px;
  color: #fff;
  padding: 10px;
  background-color: hsl(221, 100%, 58%);
`;

export interface ScriptsManagementViewProps
  extends RouteComponentProps<ScriptsManagementMatch> {}

@observer
export class ScriptsManagementView extends Component<
  ScriptsManagementViewProps
> {
  @computed
  private get activeScriptName(): string | undefined {
    let {
      match: {
        namespace: {scriptName: scriptNameMatch},
      },
    } = this.props;

    if (!scriptNameMatch.$matched) {
      return undefined;
    }

    return scriptNameMatch.$params.scriptName;
  }

  @computed
  private get scriptsListRendering(): ReactNode {
    let scriptDefinitionsMap = ENTRANCES.agentService.scriptDefinitionsMap;

    if (!scriptDefinitionsMap.size) {
      return (
        <EmptyPanel>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </EmptyPanel>
      );
    }

    let activeName = this.activeScriptName;

    return Array.from(scriptDefinitionsMap).map(
      ([namespace, scriptDefinitions]) => (
        <ScriptDefinitionsWrapper key={namespace}>
          <Namespace>{namespace}</Namespace>
          {scriptDefinitions.map(({type, name, displayName}) => (
            <BriefItem
              key={name}
              className={classNames({active: name === activeName})}
              onClick={this.getOnScriptItemClick(namespace, name)}
            >
              <ScriptType>{type}</ScriptType>
              {displayName}
              <ScriptName>({name})</ScriptName>
            </BriefItem>
          ))}
        </ScriptDefinitionsWrapper>
      ),
    );
  }

  @computed
  private get notSelectedPanelRendering(): ReactNode {
    let commandSelected = this.props.match.namespace.scriptName.$matched;

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
          <Route
            match={match.namespace.scriptName}
            component={ScriptDefinitionViewerView}
          />
          {this.notSelectedPanelRendering}
        </ViewerPanel>
      </Wrapper>
    );
  }

  private onBackButtonClick = (): void => {
    route.scripts.records.$push();
  };

  @memorize()
  private getOnScriptItemClick(
    namespace: string,
    name: string,
  ): MouseEventHandler {
    return () => {
      let {match} = this.props;

      match.namespace.scriptName.$push({namespace, scriptName: name});
    };
  }
}
