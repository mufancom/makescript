import {CaretRightFilled} from '@ant-design/icons';
import {
  BriefScriptDefinition,
  ScriptDefinitionDetailedParameter,
} from '@makeflow/makescript-agent';
import {Input, Modal, Table, Tooltip, message} from 'antd';
import ClipboardJS from 'clipboard';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';
import {Dict} from 'tslang';

import {ENTRANCES} from '../../@constants';

import {ExecuteButton, Item, Label, Title} from './@common';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

const JSON_INDENTATION = 2;

const RUNNING_LINK_ID = 'running-link';

const Wrapper = styled.div`
  flex: 1;
  background-color: #fff;
  box-shadow: hsla(0, 0%, 0%, 0.08) 0 2px 4px 0;
  border-radius: 2px;
  position: relative;
  overflow: hidden;

  .ant-table-cell {
    padding: 5px 10px !important;

    pre {
      margin: 0;
    }
  }
`;

const Content = styled.div`
  height: 100%;
  width: 100%;
  padding: 60px;
  overflow: auto;
`;

const RequiredTip = styled.span`
  color: red;
`;

const ParametersTable = styled.table`
  width: 100%;

  tr,
  td {
    padding: 5px;
  }
`;

export interface ScriptDefinitionViewerProps {
  baseURL: string;
  namespace: string;
  scriptDefinition: BriefScriptDefinition;
}

@observer
export class ScriptDefinitionViewer extends Component<
  ScriptDefinitionViewerProps
> {
  private clipboardJS: ClipboardJS | undefined;

  @computed
  private get parametersRendering(): ReactNode {
    let {
      scriptDefinition: {parameters},
    } = this.props;

    if (!parameters || !parameters.length) {
      return (
        <>
          <Label>脚本参数</Label>
          <Item>该脚本不接受参数</Item>
        </>
      );
    }

    return (
      <>
        <Label>脚本参数</Label>
        <Table
          pagination={false}
          dataSource={parameters.map(item => {
            let name = typeof item === 'string' ? item : item.name;

            return {
              key: name,
              name,
              definition: (
                <pre>{JSON.stringify(item, undefined, JSON_INDENTATION)}</pre>
              ),
            };
          })}
          columns={[
            {title: '参数名', dataIndex: 'name', key: 'name'},
            {title: '参数定义', dataIndex: 'definition', key: 'definition'},
          ]}
        />
      </>
    );
  }

  render(): ReactNode {
    let {namespace, baseURL, scriptDefinition} = this.props;

    if (!scriptDefinition) {
      return <div>脚本未找到</div>;
    }

    let {type, name, manual} = scriptDefinition;

    return (
      <Wrapper>
        <Content>
          <Title>
            {type}: {name}
          </Title>
          <Label>执行链接</Label>
          <Tooltip title="点击复制到剪切板">
            <Item
              id={RUNNING_LINK_ID}
            >{`${baseURL}/api/script/${namespace}/${name}/enqueue`}</Item>
          </Tooltip>
          <Label>需手动执行</Label>
          <Item>{manual ? '是' : '否'}</Item>
          {this.parametersRendering}
        </Content>
        <Tooltip
          title="手动触发并执行该脚本"
          mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
        >
          <ExecuteButton onClick={this.onExecuteButtonClick}>
            <CaretRightFilled />
          </ExecuteButton>
        </Tooltip>
      </Wrapper>
    );
  }

  componentDidMount(): void {
    let clipboard = new ClipboardJS(`#${RUNNING_LINK_ID}`, {
      target: element => element,
    });

    clipboard.on('success', () => {
      void message.success('已成功复制剪切板');
    });

    clipboard.on('error', async () => {
      void message.error(`操作失败，请手动复制`);
    });

    this.clipboardJS = clipboard;
  }

  componentWillUnmount(): void {
    this.clipboardJS?.destroy();
  }

  private onExecuteButtonClick = (): void => {
    let {scriptDefinition, namespace} = this.props;

    if (
      !scriptDefinition.parameters?.length &&
      !scriptDefinition.needsPassword
    ) {
      Modal.confirm({
        title: '手动执行脚本',
        content: `即使是需要手动执行的脚本在触发后也会立即执行，确定要手动触发并执行 "${scriptDefinition.name}" 脚本吗？`,
        onOk: async () => {
          await ENTRANCES.scriptService.runScriptDirectly({
            namespace,
            name: scriptDefinition.name,
            parameters: {},
            password: undefined,
          });
          void message.success('执行成功');
        },
      });
    } else {
      let requiredParameterNames = scriptDefinition.parameters
        .filter(
          parameter => typeof parameter !== 'string' && parameter.required,
        )
        .map(paramter => (paramter as ScriptDefinitionDetailedParameter).name);
      let parameterResult: Dict<string> = {};
      let password = '';

      Modal.confirm({
        title: '手动执行脚本',
        content: (
          <ParametersTable>
            {scriptDefinition.parameters.map(parameter => {
              let parameterName =
                typeof parameter === 'string' ? parameter : parameter.name;

              return (
                <tr key={parameterName}>
                  <td>
                    {parameterName}
                    {requiredParameterNames.includes(parameterName) ? (
                      <RequiredTip>*</RequiredTip>
                    ) : undefined}
                  </td>
                  <td>
                    <Input
                      onChange={({currentTarget: {value}}) => {
                        parameterResult[parameterName] = value;
                      }}
                    />
                  </td>
                </tr>
              );
            })}
            {scriptDefinition.needsPassword ? (
              <tr>
                <td>
                  执行密码<RequiredTip>*</RequiredTip>
                </td>
                <td>
                  <Input
                    onChange={({currentTarget: {value}}) => {
                      password = value;
                    }}
                  />
                </td>
              </tr>
            ) : undefined}
          </ParametersTable>
        ),
        onOk: async () => {
          if (
            requiredParameterNames.every(name => !!parameterResult[name]) &&
            (!scriptDefinition.needsPassword || password)
          ) {
            await ENTRANCES.scriptService.runScriptDirectly({
              namespace,
              name: scriptDefinition.name,
              parameters: parameterResult,
              password,
            });
            void message.success('执行成功');
          } else {
            void message.error('必填的参数不能为空');
            // Do not close the modal
            throw new Error();
          }
        },
      });
    }
  };
}
