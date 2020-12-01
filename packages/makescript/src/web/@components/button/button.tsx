import styled from 'styled-components';

export const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  text-align: center;
  color: hsl(0, 100%, 100%);
  background-color: hsl(221, 100%, 58%);
  border-radius: 4px;
  transition: background-color 0.3s;
  text-decoration: none;
  border: 0;
  cursor: pointer;

  &:hover {
    background-color: hsl(221, 100%, 50%);
  }

  &:disabled {
    background-color: hsl(221, 12%, 89%);
  }
`;
