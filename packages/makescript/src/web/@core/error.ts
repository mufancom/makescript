import ExtendableError from 'extendable-error';

export class ExpectedError extends ExtendableError {
  constructor(readonly code: string, message?: string) {
    super(message);
  }
}
