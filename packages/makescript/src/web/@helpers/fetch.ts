import {ExpectedError} from '../@core';

export async function fetchAPI<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  let response = await fetch(url, {
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    ...init,
  });

  if (response.redirected && location.href !== response.url) {
    location.href = response.url;
  }

  if (!response.ok) {
    throw new ExpectedError(
      'REQUEST_FAILED',
      `The request expect 200 for response status code, but got ${response.status}: ${response.url}`,
    );
  }

  let textBody = await response.text();

  try {
    return JSON.parse(textBody);
  } catch {}

  return (textBody as unknown) as TResponse;
}
