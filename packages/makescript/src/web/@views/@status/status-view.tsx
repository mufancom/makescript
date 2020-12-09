import {Link, RouteComponentProps} from 'boring-router-react';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

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

const RegisteredAgentWrapper = styled.div``;

const RegisteredAgentScriptQuantity = styled.div``;

const Label = styled.div`
  color: #666;
  padding: 20px 10px 10px 10px;
`;

const JoinLink = styled.div``;

const RegisteredAgentNamespace = styled.div``;

export interface StatusProps extends RouteComponentProps<StatusMatch> {}

@observer
export class StatusView extends Component<StatusProps> {
  render(): ReactNode {
    let status = ENTRANCES.agentService.status;

    if (!status) {
      return <></>;
    }

    return (
      <Wrapper>
        <Card title="系统状态" summary="代理加入链接及已注册代理">
          <Label>代理加入链接</Label>
          <JoinLink>{status?.joinLink}</JoinLink>
          <Label>已注册代理</Label>
          {status?.registeredAgents.map(registeredAgent => (
            <RegisteredAgentWrapper>
              <RegisteredAgentNamespace key={registeredAgent.namespace}>
                {registeredAgent.namespace}
              </RegisteredAgentNamespace>
              <RegisteredAgentScriptQuantity>
                {registeredAgent.scriptQuantity}
              </RegisteredAgentScriptQuantity>
            </RegisteredAgentWrapper>
          ))}
          <Link to={route.home}>
            <Button>返回</Button>
          </Link>
        </Card>
      </Wrapper>
    );
  }
}
