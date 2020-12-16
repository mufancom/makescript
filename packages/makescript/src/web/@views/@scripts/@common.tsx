import React, {FunctionComponent} from 'react';
import styled from 'styled-components';
import {Dict} from 'tslang';

export const Wrapper = styled.div`
  box-sizing: border-box;
  width: 100vw;
  max-width: 1000px;
  height: 100vh;
  padding: 50px;
  margin: 0 auto;
  display: flex;
`;

export const ExecuteButton = styled.div`
  position: absolute;
  bottom: 40px;
  right: 40px;
  font-size: 20px;
  line-height: 30px;
  width: 40px;
  height: 40px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 50%;
  background-color: hsl(221, 100%, 58%);
  box-shadow: 0 4px 12px -4px hsl(221, 93%, 73%);
  transition: background-color 0.3s, box-shadow 0.3s;
  cursor: pointer;

  &:hover {
    background-color: hsl(221, 100%, 50%);
    box-shadow: 0 4px 12px -4px hsl(221, 93%, 50%);
  }
`;

export const ScriptList = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 250px;
  box-shadow: hsla(0, 0%, 0%, 0.08) 0 2px 4px 0;
  background-color: hsl(0, 0%, 100%);
  margin-right: 20px;
  border-radius: 2px;
`;

export const ScriptListContent = styled.div`
  flex: 1;
  overflow: auto;
`;

export const ScriptListLabel = styled.div`
  line-height: 20px;
  font-size: 14px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
`;

export const ScriptBriefItem = styled.div`
  font-size: 13px;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;

  &.highlight {
    background-color: hsl(41, 100%, 97%);
  }

  &.error {
    background-color: hsl(11, 77%, 97%);
  }

  &:hover {
    background-color: hsl(0, 0%, 97%);
  }

  &.active {
    background-color: hsl(221, 100%, 97%);
  }
`;

export const ScriptType = styled.div`
  align-self: flex-end;
  font-size: 12px;
  color: hsl(0, 0%, 60%);
  margin-left: 10px;
`;

export const Title = styled.div`
  color: hsl(0, 0%, 100%);
  font-size: 16px;
  background-color: hsl(221, 100%, 58%);
  border-radius: 5px;
  padding: 5px 10px;
  width: fit-content;
`;

export const Label = styled.div`
  line-height: 16px;
  color: hsl(0, 0%, 40%);
  margin: 16px 0 10px 0;
  font-size: 12px;
`;

export const Item = styled.div`
  display: flex;
  font-size: 14px;
`;

export const EmptyPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: hsl(0, 0%, 60%);
  font-size: 14px;
`;

export const NotSelectedPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: hsl(0, 100%, 100%);
  box-shadow: hsla(0, 0%, 0%, 0.08) 0 2px 4px 0;
  color: hsl(0, 0%, 60%);
  border-radius: 2px;
`;

export const DictContent: FunctionComponent<{
  dict?: Dict<unknown>;
  label: string;
}> = ({dict, label}) => {
  let entries = dict && Object.entries(dict);

  if (!entries || !entries.length) {
    return <></>;
  }

  return (
    <>
      <Label>{label}</Label>
      {entries.map(([key, value]) => (
        <Item key={key}>
          {key}: {String(value)}
        </Item>
      ))}
    </>
  );
};
