import {CaretRightFilled} from '@ant-design/icons';
import {
  BriefScriptDefinition,
  ScriptDefinitionDetailedParameter,
} from '@makeflow/makescript-agent';
import {Input, Modal, Tooltip, message} from 'antd';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';
import {Dict} from 'tslang';

import {ExecuteButton, Item, Label, Title} from './@common';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

const Wrapper = styled.div`
  flex: 1;
  background-color: #fff;
  box-shadow: hsla(0, 0%, 0%, 0.08) 0 2px 4px 0;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`;

const Content = styled.div`
  height: 100%;
  width: 100%;
  padding: 60px;
  overflow: auto;
`;

const InputItem = styled.div`
  display: flex;
  align-items: center;
`;

const RequiredTip = styled.div`
  color: red;
`;

const RequiredItemStar = styled.div`
  color: hsl(11, 97%, 55%);
`;

const ParameterInfo = styled.div`
  margin-left: 5px;
  color: #666;
  font-size: 0.8em;
`;

export interface ScriptDefinitionViewerProps {
  scriptDefinition: BriefScriptDefinition;
}

@observer
export class ScriptDefinitionViewer extends Component<
  ScriptDefinitionViewerProps
> {
  @computed
  private get scriptDefinition(): BriefScriptDefinition {
    let {scriptDefinition} = this.props;

    return scriptDefinition;
  }

  @computed
  private get parametersRendering(): ReactNode {
    let parameters = this.scriptDefinition?.parameters;

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
        {parameters.map((item, index) =>
          typeof item !== 'object' ? (
            <Item key={index}>{item}</Item>
          ) : (
            <Item key={index}>
              {item.displayName}
              {item.required ? (
                <RequiredItemStar>*</RequiredItemStar>
              ) : undefined}
              <ParameterInfo>
                ( {item.name}
                {item.field ? ` | ${JSON.stringify(item.field)}` : ''} )
              </ParameterInfo>
            </Item>
          ),
        )}
      </>
    );
  }

  render(): ReactNode {
    let scriptDefinition = this.scriptDefinition;

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
          <Label>源文件</Label>
          <Label>需手动执行</Label>
          <Item>{manual ? '是' : '否'}</Item>
          {this.parametersRendering}
        </Content>

        {/* TODO: */}
        {false ? (
          <Tooltip
            title="手动触发并执行该脚本"
            mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
          >
            <ExecuteButton onClick={this.onExecuteButtonClick}>
              <CaretRightFilled />
            </ExecuteButton>
          </Tooltip>
        ) : undefined}
      </Wrapper>
    );
  }

  private onExecuteButtonClick = (): void => {
    const command = this.scriptDefinition;

    if (!command) {
      return;
    }

    if (!command.parameters?.length) {
      Modal.confirm({
        title: '手动执行命令',
        content: `即使是需要手动执行的命令在触发后也会立即执行，确定要手动触发并执行 "${command.name}" 命令吗？`,
        onOk: async () => {
          // TODO:
          // await ENTRANCES.scriptsService.executeCommand(command, {});
          void message.success('执行成功');
        },
      });
    } else {
      let requiredParameterNames = command.parameters
        .filter(
          parameter => typeof parameter !== 'string' && parameter.required,
        )
        .map(paramter => (paramter as ScriptDefinitionDetailedParameter).name);
      let parameterResult: Dict<string> = {};

      Modal.confirm({
        title: '手动执行脚本',
        content: (
          <>
            {command.parameters.map(parameter => {
              let parameterName =
                typeof parameter === 'string' ? parameter : parameter.name;

              return (
                <InputItem key={parameterName}>
                  {parameterName}
                  {requiredParameterNames.includes(parameterName) ? (
                    <RequiredTip>*</RequiredTip>
                  ) : undefined}
                  :
                  <Input
                    onChange={({currentTarget: {value}}) => {
                      parameterResult[parameterName] = value;
                    }}
                  />
                </InputItem>
              );
            })}
          </>
        ),
        onOk: async () => {
          if (requiredParameterNames.every(name => !!parameterResult[name])) {
            // TODO:
            // await ENTRANCES.scriptsService.executeCommand(command, parameterResult);
            await message.success('执行成功');
          } else {
            await message.error('必填的参数不能为空');
            // Do not close the modal
            throw new Error();
          }
        },
      });
    }
  };
}
