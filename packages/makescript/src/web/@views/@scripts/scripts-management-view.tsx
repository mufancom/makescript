import {ArrowLeftOutlined} from '@ant-design/icons';
import {BriefScriptDefinition} from '@makeflow/makescript-agent';
import {Empty, Menu} from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import {Route, RouteComponentProps} from 'boring-router-react';
import {computed, observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactElement, ReactNode} from 'react';
import styled from 'styled-components';

import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

import {
  EmptyPanel,
  NotSelectedPanel,
  ScriptList,
  ScriptListLabel,
  ScriptType,
  Wrapper,
} from './@common';
import {ScriptDefinitionViewer} from './@script-definition-viewer-view';

type ScriptsManagementMatch = Router['scripts']['management'];

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

export interface ScriptsManagementViewProps
  extends RouteComponentProps<ScriptsManagementMatch> {}

@observer
export class ScriptsManagementView extends Component<
  ScriptsManagementViewProps
> {
  @observable
  private scriptDefinitionsMap:
    | Map<string, BriefScriptDefinition[]>
    | undefined;

  @computed
  private get activeScriptName(): [string, string] | undefined {
    let {
      match: {
        namespace: {scriptName: scriptNameMatch},
      },
    } = this.props;

    if (!scriptNameMatch.$matched) {
      return undefined;
    }

    return [
      scriptNameMatch.$params.namespace,
      scriptNameMatch.$params.scriptName,
    ];
  }

  @computed
  private get activeScriptDefinition(): BriefScriptDefinition | undefined {
    let activeScriptName = this.activeScriptName;

    if (!activeScriptName) {
      return undefined;
    }

    return this.scriptDefinitionsMap
      ?.get(activeScriptName[0])
      ?.find(
        scriptDefinition => scriptDefinition.name === activeScriptName![1],
      );
  }

  private scriptDefinitionViewerView = observer(
    (): ReactElement => {
      let activeScriptDefinition = this.activeScriptDefinition;

      if (!activeScriptDefinition) {
        return <></>;
      }

      return (
        <ScriptDefinitionViewer scriptDefinition={activeScriptDefinition} />
      );
    },
  );

  @computed
  private get scriptsListRendering(): ReactNode {
    let scriptDefinitionsMap = this.scriptDefinitionsMap;

    if (!scriptDefinitionsMap) {
      return (
        <EmptyPanel>
          <Empty description="正在加载..." />
        </EmptyPanel>
      );
    }

    if (!scriptDefinitionsMap.size) {
      return (
        <EmptyPanel>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </EmptyPanel>
      );
    }

    let [activeNamespace, activeScriptName] = this.activeScriptName ?? [];

    return (
      <Menu
        mode="inline"
        defaultOpenKeys={activeNamespace ? [activeNamespace] : []}
        selectedKeys={[`${activeNamespace}:${activeScriptName}`]}
        onClick={({key}) => {
          let {match} = this.props;

          let [namespace, scriptName] = String(key).split(':');

          match.namespace.scriptName.$push({
            namespace,
            scriptName,
          });
        }}
      >
        {Array.from(scriptDefinitionsMap).map(
          ([namespace, scriptDefinitions]) => (
            <SubMenu key={namespace} title={namespace}>
              {scriptDefinitions.map(({name, displayName}) => (
                <Menu.Item key={`${namespace}:${name}`}>
                  {displayName}
                </Menu.Item>
              ))}
            </SubMenu>
          ),
        )}
      </Menu>
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
            component={this.scriptDefinitionViewerView}
          />
          {this.notSelectedPanelRendering}
        </ViewerPanel>
      </Wrapper>
    );
  }

  componentDidMount(): void {
    ENTRANCES.agentService
      .fetchScriptDefinitionsMap()
      .then(scriptDefinitionsMap => {
        this.scriptDefinitionsMap = scriptDefinitionsMap;
      })
      .catch(console.error);
  }

  private onBackButtonClick = (): void => {
    route.scripts.records.$push();
  };
}
