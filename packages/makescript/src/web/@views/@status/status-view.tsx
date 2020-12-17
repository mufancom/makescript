import {Empty, Tooltip, message} from 'antd';
import {Link, RouteComponentProps} from 'boring-router-react';
import ClipboardJS from 'clipboard';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';
import {AgentsStatus} from '../../@services';

type StatusMatch = Router['status'];

const Wrapper = styled.div`
  display: flex;
  width: 100vw;
  min-height: 100vh;
  justify-content: center;
  align-items: center;

  ${Card.Wrapper} {
    display: flex;
    flex-direction: column;
    width: 500px;
  }
`;

export const Label = styled.div`
  line-height: 16px;
  color: hsl(0, 0%, 40%);
  margin: 16px 0 10px 0;
  font-size: 12px;
`;

export const Item = styled.div`
  display: flex;
  font-size: 14px;
`;

const RegisteredAgentWrapper = styled.div`
  display: flex;
  background-color: hsl(101, 51%, 58%);
  color: #fff;
  padding: 10px;
  margin: 10px;
  border-radius: 10px;
`;

const RegisteredAgentNamespace = styled.div`
  flex-grow: 1;
`;

const RegisteredAgentScriptQuantity = styled.div``;

const JoinLink = styled.div`
  cursor: pointer;
`;

const BackButton = styled(Button)`
  width: 100%;
  margin-top: 20px;
`;

export interface StatusProps extends RouteComponentProps<StatusMatch> {}

@observer
export class StatusView extends Component<StatusProps> {
  @observable
  private status: AgentsStatus | undefined;

  render(): ReactNode {
    let status = this.status;

    return (
      <Wrapper>
        <Card title="节点管理" summary="代理加入链接及已注册代理">
          {status ? (
            <>
              <Label>代理加入链接</Label>
              <Item>
                <Tooltip title="点击复制到剪切板">
                  <JoinLink id="join-link">{status.joinLink}</JoinLink>
                </Tooltip>
              </Item>
              <Label>已注册代理</Label>
              {status.registeredAgents.length ? (
                status.registeredAgents.map(registeredAgent => (
                  <Tooltip
                    key={registeredAgent.namespace}
                    title={`代理 ${registeredAgent.namespace} 共有 ${registeredAgent.scriptQuantity} 个脚本`}
                  >
                    <RegisteredAgentWrapper>
                      <RegisteredAgentNamespace key={registeredAgent.namespace}>
                        {registeredAgent.namespace}
                      </RegisteredAgentNamespace>
                      <RegisteredAgentScriptQuantity>
                        {registeredAgent.scriptQuantity}
                      </RegisteredAgentScriptQuantity>
                    </RegisteredAgentWrapper>
                  </Tooltip>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <>
                      没有已注册的代理，请到{' '}
                      <a
                        href="https://github.com/makeflow/makescript"
                        target="_blank"
                      >
                        GitHub
                      </a>{' '}
                      查看如何使用代理。
                    </>
                  }
                />
              )}
            </>
          ) : (
            <Empty description="正在加载..." />
          )}

          <Link to={route}>
            <BackButton>返回</BackButton>
          </Link>
        </Card>
      </Wrapper>
    );
  }

  componentDidMount(): void {
    ENTRANCES.agentService
      .fetchStatus()
      .then(status => {
        this.status = status;

        setTimeout(() => {
          let clipboard = new ClipboardJS('#join-link', {
            target: () => document.querySelector('#join-link')!,
          });

          clipboard.on('success', () => {
            void message.success('已成功复制剪切板');
          });

          clipboard.on('error', async () => {
            void message.error(`操作失败，请手动复制`);
          });
        });
      })
      .catch(console.error);
  }
}
