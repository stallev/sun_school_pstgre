const RETRY_DELAYS_MS = [300, 600] as const;

function isRetriableNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("Load failed");
}

export async function resilientPostFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.status >= 400) {
        return response;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (!isRetriableNetworkError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAYS_MS[attempt]);
      });
    }
  }

  throw lastError;
}
