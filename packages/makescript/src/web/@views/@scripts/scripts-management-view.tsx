import {ArrowLeftOutlined} from '@ant-design/icons';
import {BriefScriptDefinition} from '@makeflow/makescript-agent';
import {Empty} from 'antd';
import {Route, RouteComponentProps} from 'boring-router-react';
import classNames from 'classnames';
import memorize from 'memorize-decorator';
import {computed, observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {
  Component,
  MouseEventHandler,
  ReactElement,
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

const ScriptDefinitionsWrapper = styled.div`
  overflow-y: auto;
`;

const ScriptDefinitionsForANamespace = styled.div`
  margin-top: 20px;
`;

const Namespace = styled.div`
  font-size: 14px;
  color: #fff;
  padding: 10px;
  background-color: hsl(101, 51%, 58%);
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
      <ScriptDefinitionsWrapper>
        {Array.from(scriptDefinitionsMap).map(
          ([namespace, scriptDefinitions]) => (
            <ScriptDefinitionsForANamespace key={namespace}>
              <Namespace>{namespace}</Namespace>
              {scriptDefinitions.map(({type, name, displayName}) => (
                <ScriptBriefItem
                  key={name}
                  className={classNames({
                    active:
                      namespace === activeNamespace &&
                      name === activeScriptName,
                  })}
                  onClick={this.getOnScriptItemClick(namespace, name)}
                >
                  <ScriptType>{type}</ScriptType>
                  {displayName}
                  <ScriptName>({name})</ScriptName>
                </ScriptBriefItem>
              ))}
            </ScriptDefinitionsForANamespace>
          ),
        )}
      </ScriptDefinitionsWrapper>
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
