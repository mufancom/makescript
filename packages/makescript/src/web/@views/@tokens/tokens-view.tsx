import {CloseOutlined} from '@ant-design/icons';
import {List, Modal, Tooltip, message} from 'antd';
import {RouteComponentProps} from 'boring-router-react';
import memorize from 'memorize-decorator';
import {action, computed, observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, MouseEventHandler, ReactNode} from 'react';
import styled from 'styled-components';

import {ActiveToken} from '../../../program/types';
import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {Router, route} from '../../@routes';

import {GenerateModal} from './@generate-modal';

const TOOLTIP_MOUSE_ENTER_DELAY = 0.5;

const Wrapper = styled.div`
  box-sizing: border-box;
  width: 100vw;
  min-height: 100vh;
  padding: 50px 0;
  display: flex;
  justify-content: center;
  align-items: center;

  ${Card.Wrapper} {
    width: 420px;
  }

  ${Button},
  .token-list {
    margin-top: 20px;
  }
`;

const DeactivateButton = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: hsl(0, 0%, 40%);
  cursor: pointer;
`;

const TokenItem = styled.div`
  height: 40px;
  padding-left: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 2px;
  color: hsl(0, 0%, 20%);

  ${DeactivateButton} {
    display: none;
  }

  &:hover {
    background-color: hsl(221, 100%, 97%);

    ${DeactivateButton} {
      display: flex;
    }
  }
`;

const TokenList = styled(List)`
  max-height: 230px;
  overflow-y: auto;
`;

export interface TokensViewProps
  extends RouteComponentProps<Router['tokens']> {}

@observer
export class TokensView extends Component<TokensViewProps> {
  @observable
  private generateModalVisible = false;

  @computed
  private get tokens(): ActiveToken[] {
    return ENTRANCES.tokenService.tokens.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  @computed
  private get tokensRendering(): ReactNode {
    return (
      <TokenList
        className="token-list"
        bordered
        dataSource={this.tokens}
        renderItem={(token: ActiveToken) => (
          <TokenItem key={token.id}>
            {token.label}
            <Tooltip
              placement="top"
              title="停用 Token"
              mouseEnterDelay={TOOLTIP_MOUSE_ENTER_DELAY}
            >
              <DeactivateButton
                onClick={this.getOnDeactivateTokenButtonClick(token)}
              >
                <CloseOutlined />
              </DeactivateButton>
            </Tooltip>
          </TokenItem>
        )}
      />
    );
  }

  render(): ReactNode {
    return (
      <Wrapper>
        <Card title="Token 管理" summary="管理调用 API 时所需的 Token">
          {this.tokensRendering}
          <Button onClick={this.onGenerateButtonClick}>新建</Button>
          <Button onClick={this.onBackButtonClick}>返回</Button>
        </Card>
        <GenerateModal
          visible={this.generateModalVisible}
          onCancel={this.onGenerateModalCancel}
        />
      </Wrapper>
    );
  }

  private onGenerateButtonClick = async (): Promise<void> => {
    this.setGenerateModalVisible(true);
  };

  private onGenerateModalCancel = (): void => {
    this.setGenerateModalVisible(false);
  };

  private onBackButtonClick = (): void => {
    route.$push();
  };

  @memorize()
  private getOnDeactivateTokenButtonClick({
    id,
    label,
  }: ActiveToken): MouseEventHandler {
    return async () => {
      Modal.confirm({
        title: '停用 Token',
        content: `是否确定停用 ${label} ?`,
        onOk: async () => {
          try {
            await ENTRANCES.tokenService.disableToken(id);
            void message.success('停用成功');
          } catch (error) {
            void message.error('停用失败');
          }
        },
      });
    };
  }

  @action
  private setGenerateModalVisible(visible: boolean): void {
    this.generateModalVisible = visible;
  }
}
