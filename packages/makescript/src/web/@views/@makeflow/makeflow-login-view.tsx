import {Input, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import {action, computed, observable, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import React, {ChangeEvent, Component, KeyboardEvent, ReactNode} from 'react';
import styled from 'styled-components';

import {MFUserCandidate} from '../../../program/types';
import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

import {CandidatesModal} from './@candidates-modal';

const Wrapper = styled.div`
  min-height: 100vh;
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

export interface MakeflowLoginViewProps
  extends RouteComponentProps<Router['makeflow']['login']> {}

@observer
export class MakeflowLoginView extends Component<MakeflowLoginViewProps> {
  @observable
  private candidatesModalVisible = false;

  @observable
  private candidates: MFUserCandidate[] | undefined;

  @observable
  private username = '';

  @observable
  private password = '';

  @computed
  private get inputsAvailable(): boolean {
    return !!this.username && !!this.password;
  }

  @computed
  private get candidatesModalRendering(): ReactNode {
    let candidates = this.candidates;

    if (!this.candidatesModalVisible || !candidates) {
      return undefined;
    }

    return (
      <CandidatesModal
        username={this.username}
        password={this.password}
        candidates={candidates}
        onCancel={this.onModalCancel}
        onSuccess={this.onModalSuccess}
        onError={this.onModalError}
      />
    );
  }

  render(): ReactNode {
    return (
      <Wrapper>
        {this.candidatesModalRendering}
        <Card title="登录到 Makeflow" summary="登录到 Makeflow 以进行相关操作">
          <Input
            className="input"
            size="large"
            type="mobile"
            placeholder="用户名 (手机号)"
            value={this.username}
            onChange={this.onUsernameChange}
          />
          <Input
            className="input"
            size="large"
            type="password"
            placeholder="密码"
            value={this.password}
            onChange={this.onPasswordChange}
            onKeyDown={this.onInputKeyDown}
          />
          <Button
            disabled={!this.inputsAvailable}
            onClick={this.onLoginButtonClick}
          >
            登录到 Makeflow
          </Button>
          <Button onClick={this.onBackButtonClick}>返回</Button>
        </Card>
      </Wrapper>
    );
  }

  private onUsernameChange = ({
    currentTarget: {value},
  }: ChangeEvent<HTMLInputElement>): void => {
    this.setUsername(value);
  };

  private onPasswordChange = ({
    currentTarget: {value},
  }: ChangeEvent<HTMLInputElement>): void => {
    this.setPassword(value);
  };

  private onBackButtonClick = (): void => {
    this.goBack();
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
    if (!this.inputsAvailable) {
      return;
    }

    try {
      let candidates = await ENTRANCES.makeflowService.listUserCandidates(
        this.username,
        this.password,
      );

      if (candidates.length === 1) {
        let [candidate] = candidates;

        await ENTRANCES.makeflowService.authenticate(
          this.username,
          this.password,
          candidate.id,
        );

        await message.success('登录成功');
        this.goBack();
      } else {
        runInAction(() => {
          this.candidates = candidates;
          this.candidatesModalVisible = true;
        });
      }
    } catch {
      await message.error('登录失败');
    }
  }

  private onModalError = (): void => {
    message.error('登录失败').promise.catch(console.error);

    runInAction(() => {
      this.candidatesModalVisible = false;
    });
  };

  private onModalSuccess = (): void => {
    message.success('登录成功').promise.catch(console.error);
    this.goBack();

    runInAction(() => {
      this.candidatesModalVisible = false;
    });
  };

  private onModalCancel = (): void => {
    runInAction(() => {
      this.candidatesModalVisible = false;
    });
  };

  private goBack(): void {
    route.makeflow.$push();
  }

  @action
  private setUsername(username: string): void {
    this.username = username;
  }

  @action
  private setPassword(password: string): void {
    this.password = password;
  }
}
