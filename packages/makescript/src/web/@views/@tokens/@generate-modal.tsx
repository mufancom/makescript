import {Input, Modal, message} from 'antd';
import ClipboardJS from 'clipboard';
import {action, observable, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import React, {ChangeEvent, Component, ReactNode} from 'react';

import {ENTRANCES} from '../../@constants';

export interface GenerateModalProps {
  visible: boolean;
  onCancel(): void;
}

@observer
export class GenerateModal extends Component<GenerateModalProps> {
  @observable
  private label = '';

  render(): ReactNode {
    let {visible, onCancel} = this.props;

    return (
      <Modal
        wrapClassName="ant-modal-wrapper"
        title="生成 Token"
        width={450}
        visible={visible}
        okText="生成"
        cancelText="取消"
        okButtonProps={{disabled: !this.label}}
        onOk={this.onGenerateToken}
        onCancel={onCancel}
      >
        <Input
          placeholder="备注信息"
          value={this.label}
          onChange={this.onLabelInputChange}
        />
      </Modal>
    );
  }

  private onLabelInputChange = ({
    currentTarget: {value},
  }: ChangeEvent<HTMLInputElement>): void => {
    this.setLabel(value);
  };

  private onGenerateToken = async (): Promise<void> => {
    try {
      let label = this.label;

      if (!label) {
        void message.error('请输入备注');
        return;
      }

      let token = await ENTRANCES.tokenService.generateToken(label);

      runInAction(() => {
        this.label = '';
      });

      Modal.confirm({
        icon: <></>,
        title: '生成成功',
        content: (
          <>
            <div>已成功生成新 Token:</div>
            <div id="token-content-to-copy">{token}</div>
          </>
        ),
        cancelText: '知道了',
        okText: '复制到剪切板',
        // '_' is to prevent closing
        onOk: _ => {},
        okButtonProps: {
          id: 'copy-button',
        },
      });

      let clipboard = new ClipboardJS('#copy-button', {
        target: () => document.querySelector('#token-content-to-copy')!,
      });

      clipboard.on('success', async () => {
        void message.success('已复制到剪切板');
      });
      clipboard.on('error', async () => {
        void message.error('复制失败, 请手动复制');
      });
    } catch (error) {
      void message.error(`操作失败${error.message}`);
    }

    let {onCancel} = this.props;

    onCancel();
  };

  @action
  private setLabel(label: string): void {
    this.label = label;
  }
}
