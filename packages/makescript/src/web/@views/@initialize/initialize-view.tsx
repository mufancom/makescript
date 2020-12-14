import {Input, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import {computed, observable} from 'mobx';
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

export interface InitializeViewProps
  extends RouteComponentProps<Router['initialize']> {}

@observer
export class InitializeView extends Component<InitializeViewProps> {
  @observable
  private password: string | undefined;

  @computed
  private get formAvailable(): boolean {
    let password = this.password;

    return !!password && password.length >= 6;
  }

  render(): ReactNode {
    return (
      <Wrapper>
        <Card title="初始化" summary="请输入密码以初始化应用">
          <Input
            className="input"
            size="large"
            type="password"
            placeholder="输入密码 (长度为6位及以上)"
            value={this.password}
            onChange={this.onPasswordChange}
            onKeyDown={this.onInputKeyDown}
          />
          <Button
            disabled={!this.formAvailable}
            onClick={this.onInitialButtonClick}
          >
            初始化
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

  private onInitialButtonClick = (): void => {
    this.tryToInitialize().catch(console.error);
  };

  private onInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.tryToInitialize().catch(console.error);
    }
  };

  private async tryToInitialize(): Promise<void> {
    if (!this.formAvailable) {
      return;
    }

    try {
      let password = this.password!;

      await ENTRANCES.authorizationService.initialize(password);
      route.home.$push();
    } catch (error) {
      console.error(error);

      if (error.code === 'HAS_BEEN_INITIALIZED_ALREADY') {
        await message.error(<div>应用已经初始化过了</div>);
      } else {
        await message.error('初始化失败');
      }
    }
  }
}
