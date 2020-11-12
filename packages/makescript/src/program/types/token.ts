import {TokenModel} from '../@core';

export interface ActiveToken {
  id: string;
  label: string;
}

export function convertTokenModelToActiveToken({
  id,
  label,
}: TokenModel): ActiveToken {
  return {
    id,
    label,
  };
}
