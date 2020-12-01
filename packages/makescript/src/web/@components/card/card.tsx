import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 350px;
  border-radius: 5px;
  padding: 60px;
  box-shadow: hsla(0, 0%, 0%, 0.12) 0 0 12px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  font-weight: 300;
  line-height: 40px;
  color: hsl(0, 0%, 20%);
`;

const Summary = styled.div`
  font-size: 14px;
  line-height: 20px;
  margin: 10px 0;
  color: hsl(0, 0%, 60%);
`;

export interface CardProps {
  title: string;
  summary: string;
}

export class Card extends Component<CardProps> {
  render(): ReactNode {
    let {title, summary, children} = this.props;

    return (
      <Wrapper>
        <Title>{title}</Title>
        <Summary>{summary}</Summary>
        {children}
      </Wrapper>
    );
  }

  static Wrapper = Wrapper;
}
