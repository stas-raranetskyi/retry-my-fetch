interface beforeRefetch {
  (url: string, code: number, counter: number): Promise<void>;
}

interface decoratorOptions {
  beforeRefetch: beforeRefetch;
  maxTryCount?: number;
}

interface fetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
  mode: RequestMode;
  cache: RequestCache;
  credentials: RequestCredentials;
  headers: Headers;
  redirect: RequestRedirect;
  referrerPolicy: 'no-referrer' | 'client';
  body: string;
}

interface Fetch {
  (url: string, options: fetchOptions): Promise<Response>;
}

function retryMyFetch(http: Fetch, params: decoratorOptions): Fetch {
  let counter = 0;
  const defaultRefreshCallback: beforeRefetch = () => Promise.resolve();
  const caller: Fetch = function (url: string, options: fetchOptions) {
    const { beforeRefetch = defaultRefreshCallback, maxTryCount = 5 } = params;
    return new Promise((resolve, reject) => {
      http(url, options).then((data) => {
        if (data.ok !== true) {
          counter += 1;
          if (counter <= maxTryCount) {
            beforeRefetch(url, data.status, counter)
              .then(() => {
                caller(url, options).then(resolve).catch(reject);
              })
              .catch(reject);
          } else {
            reject(data);
          }
        } else {
          resolve(data);
        }
      });
    });
  };
  return caller;
}

export default retryMyFetch;
