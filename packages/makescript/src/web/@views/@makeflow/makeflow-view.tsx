import 'highlight.js/styles/github.css';

import {Modal, message} from 'antd';
import {Link as _Link, RouteComponentProps} from 'boring-router-react';
import highlight from 'highlight.js/lib/core';
import jsonHighlight from 'highlight.js/lib/languages/json';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

import {Button, Card} from '../../@components';
import {ENTRANCES} from '../../@constants';
import {ExpectedError} from '../../@core';
import {Router, route} from '../../@routes';

highlight.registerLanguage('json', jsonHighlight);

const Link = styled(_Link)``;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  ${Button} {
    margin-top: 20px;
  }

  ${Card.Wrapper} {
    width: 420px;

    ${Link} {
      margin-top: 20px;
      display: flex;

      ${Button} {
        margin-top: 0;
        flex: 1;
      }
    }
  }
`;

const PreviewWrapper = styled.div`
  max-height: 55vh;
  width: 800px;
  overflow: auto;
`;

export interface MakeflowViewProps
  extends RouteComponentProps<Router['makeflow']> {}

@observer
export class MakeflowView extends Component<MakeflowViewProps> {
  @observable
  private authenticated: boolean | undefined;

  render(): ReactNode {
    let authenticated = this.authenticated;

    return (
      <Wrapper>
        <Card title="Makeflow" summary="管理 Makeflow 相关信息">
          {typeof authenticated === 'undefined' ? undefined : authenticated ? (
            <Button onClick={this.onPublishButtonClick}>发布 Power APP</Button>
          ) : (
            <Link to={route.makeflow.login}>
              <Button>登录到 Makeflow</Button>
            </Link>
          )}
          <Link to={route}>
            <Button>返回</Button>
          </Link>
        </Card>
      </Wrapper>
    );
  }

  componentDidMount(): void {
    this.checkAuthentication().catch(console.error);
  }

  private onPublishButtonClick = async (): Promise<void> => {
    try {
      let definition = await ENTRANCES.makeflowService.previewAppDefinition();

      Modal.confirm({
        title: '配置预览',
        width: 800,
        content: (
          <PreviewWrapper>
            <pre
              dangerouslySetInnerHTML={{
                __html: highlight.highlight(
                  'json',
                  JSON.stringify(definition, undefined, 2),
                ).value,
              }}
            />
          </PreviewWrapper>
        ),
        onOk: this.onPreviewModalConfirm,
      });
    } catch (error) {
      if (error instanceof ExpectedError) {
        switch (error.code) {
          case 'MISSING_REQUIRED_CONFIGS':
            Modal.error({
              title: '发布失败',
              content: (
                <div>
                  缺少发布 Makeflow APP 必要的外部访问地址配置,
                  请配置文件进行配置
                </div>
              ),
            });
            break;
          case 'MISSING_COMMANDS_CONFIG':
            Modal.error({
              title: '发布失败',
              content: (
                <div>
                  脚本列表暂未初始化, 请进入
                  <Link to={route.scripts.management}>脚本管理界面</Link>
                  进行初始化.
                </div>
              ),
            });
            break;
          default:
            await message.error('发布失败');
            break;
        }
      } else {
        await message.error('发布失败');
      }
    }
  };

  private onPreviewModalConfirm = async (): Promise<void> => {
    try {
      await ENTRANCES.makeflowService.publishApp();
      await message.success(
        <>
          应用发布成功，安装时可到 <Link to={route.tokens}>Token 管理界面</Link>{' '}
          创建 Token
        </>,
      );
    } catch (error) {
      if (error instanceof ExpectedError) {
        switch (error.code) {
          case 'PERMISSION_DENIED':
            await message.error(
              '尚未登录到 Makeflow 或登录会话已过期, 请先登录',
            );
            route.makeflow.login.$push();
            break;
          default:
            await message.error('发布失败');
            break;
        }
      } else {
        await message.error('发布失败');
      }
    }
  };

  private async checkAuthentication(): Promise<void> {
    this.authenticated = await ENTRANCES.makeflowService.checkAuthentication();
  }
}
