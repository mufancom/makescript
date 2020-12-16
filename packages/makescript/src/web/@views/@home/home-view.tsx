import {Link as _Link, RouteComponentProps} from 'boring-router-react';
import {computed} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

const Wrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  justify-content: center;
  align-items: center;

  ${Card.Wrapper} {
    width: 420px;
  }
`;

const CardContent = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
`;

const Link = styled(_Link)`
  display: flex;

  ${Button} {
    flex: 1;
  }

  & + & {
    margin-top: 20px;
  }
`;

const ScriptsButton = styled(Button)`
  background-color: rgb(128, 203, 93);
`;

export interface HomeViewProps extends RouteComponentProps<Router> {}

@observer
export class HomeView extends Component<HomeViewProps> {
  @computed
  private get scriptsQuantityToExecute(): number {
    return ENTRANCES.agentService.runningRecords.filter(record => !record.ranAt)
      .length;
  }

  render(): ReactNode {
    return (
      <Wrapper>
        <Card title="开始" summary="选择一个操作开始使用">
          <CardContent>
            <Link to={route.scripts}>
              <ScriptsButton>
                脚本执行
                {this.scriptsQuantityToExecute
                  ? ` (${this.scriptsQuantityToExecute})`
                  : ''}
              </ScriptsButton>
            </Link>
            <Link to={route.tokens}>
              <Button>Token 管理</Button>
            </Link>
            <Link to={route.makeflow}>
              <Button>Makefow 集成</Button>
            </Link>
            <Link to={route.status}>
              <Button>节点管理</Button>
            </Link>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }
}
