import {Link as _Link, RouteComponentProps} from 'boring-router-react';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
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

export interface HomeViewProps extends RouteComponentProps<Router['home']> {}

@observer
export class HomeView extends Component<HomeViewProps> {
  render(): ReactNode {
    return (
      <Wrapper>
        <Card title="开始" summary="选择一个操作开始使用">
          <CardContent>
            <Link to={route.scripts}>
              <Button>脚本记录</Button>
            </Link>
            <Link to={route.tokens}>
              <Button>管理 Token</Button>
            </Link>
            <Link to={route.makeflow}>
              <Button>Makefow</Button>
            </Link>
            <Link to={route.configs}>
              <Button>更新配置</Button>
            </Link>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }
}
