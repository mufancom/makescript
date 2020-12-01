import {TokenModel} from '../@core';

export interface ActiveToken {
  id: string;
  label: string;
  createdAt: number;
}

export function convertTokenModelToActiveToken({
  id,
  label,
  createdAt,
}: TokenModel): ActiveToken {
  return {
    id,
    label,
    createdAt,
  };
}
