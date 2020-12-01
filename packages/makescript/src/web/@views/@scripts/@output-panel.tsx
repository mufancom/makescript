import classNames from 'classnames';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

const Label = styled.div`
  position: absolute;
  line-height: 20px;
  padding: 0 10px;
  border-radius: 10px;
  top: -10px;
  left: 10px;
  color: white;
`;

const Output = styled.pre`
  padding: 20px;
  margin: 0;
`;

const Wrapper = styled.div`
  position: relative;
  margin-top: 20px;
  border-radius: 5px;

  &.info {
    background-color: hsl(101, 51%, 97%);
    border: 1px solid hsl(101, 51%, 58%);

    ${Label} {
      background-color: hsl(101, 51%, 58%);
    }
  }

  &.error {
    background-color: hsl(11, 77%, 97%);
    border: 1px solid hsl(11, 77%, 58%);

    ${Label} {
      background-color: hsl(11, 77%, 58%);
    }
  }
`;

export type OutputPanelType = 'info' | 'error';

export interface OutputPanelProps {
  type: OutputPanelType;
  label: string;
  output: string;
}

@observer
export class OutputPanel extends Component<OutputPanelProps> {
  render(): ReactNode {
    let {type, label, output} = this.props;

    return (
      <Wrapper
        className={classNames({
          info: type === 'info',
          error: type === 'error',
        })}
      >
        <Label>{label}</Label>
        <Output>{output}</Output>
      </Wrapper>
    );
  }
}
