import {Input, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {ChangeEvent, Component, KeyboardEvent, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;

  ${Card.Wrapper} {
    width: 420px;

    .input,
    ${Button} {
      margin-top: 20px;
    }
  }
`;

export interface LoginViewProps extends RouteComponentProps<Router['login']> {}

@observer
export class LoginView extends Component<LoginViewProps> {
  @observable
  private password: string | undefined;

  render(): ReactNode {
    return (
      <Wrapper>
        <Card title="登录" summary="请输入密码以进入管理界面">
          <Input
            className="input"
            size="large"
            type="password"
            placeholder="输入密码"
            value={this.password}
            onChange={this.onPasswordChange}
            onKeyDown={this.onInputKeyDown}
          />
          <Button disabled={!this.password} onClick={this.onLoginButtonClick}>
            进入
          </Button>
        </Card>
      </Wrapper>
    );
  }

  private onPasswordChange = ({
    currentTarget: {value},
  }: ChangeEvent<HTMLInputElement>): void => {
    this.password = value;
  };

  private onLoginButtonClick = (): void => {
    this.tryToLogin().catch(console.error);
  };

  private onInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.tryToLogin().catch(console.error);
    }
  };

  private async tryToLogin(): Promise<void> {
    let password = this.password;

    if (!password) {
      return;
    }

    try {
      await ENTRANCES.authorizationService.login(password);
      route.home.$push();
    } catch (error) {
      if (error.code === 'PASSWORD_MISMATCH') {
        await message.error('密码错误, 请重试');
      } else {
        await message.error('登录失败');
      }
    }
  }
}
