import {Modal} from 'antd';
import memorize from 'memorize-decorator';
import {observer} from 'mobx-react';
import React, {Component, MouseEventHandler, ReactNode} from 'react';
import styled from 'styled-components';

import {MFUserCandidate} from '../../../program/types';
import {ENTRANCES} from '../../@constants';

const CandidateWrapper = styled.div`
  padding: 5px 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const CandidateAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const CandidateName = styled.div`
  margin-left: 10px;
`;

const CandidateOrganization = styled.div`
  margin-left: 5px;
  font-size: 10px;
  color: #888;
`;

export interface CandidatesModalProps {
  candidates: MFUserCandidate[];
  username: string;
  password: string;
  onCancel(): void;
  onSuccess(): void;
  onError(): void;
}

@observer
export class CandidatesModal extends Component<CandidatesModalProps> {
  render(): ReactNode {
    let {candidates, onCancel} = this.props;

    return (
      <Modal
        wrapClassName="ant-modal-wrapper"
        title="选择登录用户"
        visible={true}
        width={450}
        cancelText="取消"
        onCancel={onCancel}
      >
        {candidates.map(
          ({
            id,
            username,
            organization: {displayName: organizationName},
            profile,
          }) => (
            <CandidateWrapper
              key={id}
              onClick={this.getOnCandidateItemClick(id)}
            >
              <CandidateAvatar src={profile?.avatar} />
              <CandidateName>{profile?.fullName}</CandidateName>
              <CandidateOrganization>
                ({organizationName}/{username})
              </CandidateOrganization>
            </CandidateWrapper>
          ),
        )}
      </Modal>
    );
  }

  @memorize()
  private getOnCandidateItemClick(userId: string): MouseEventHandler {
    return async () => {
      let {username, password, onSuccess, onError} = this.props;

      try {
        await ENTRANCES.makeflowService.authenticate(
          username,
          password,
          userId,
        );

        onSuccess();
      } catch {
        onError();
      }
    };
  }
}
