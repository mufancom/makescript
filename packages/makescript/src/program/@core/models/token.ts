export interface TokenModel {
  id: string;
  label: string;
  hash: string;
  createdAt: number;
  disabledAt: number | undefined;
}
