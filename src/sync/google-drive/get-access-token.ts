// Code from https://github.com/mdn/webextensions-examples/tree/master/google-userinfo
export type AccessToken = string;

type StoredOptions = {
  googleDriveClientId?: string;
};

const getGoogleDriveClientId = (): Promise<string> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.get('options', items => {
      const options = (items['options'] || {}) as StoredOptions;
      const clientId = (options.googleDriveClientId || '').trim();

      if (!clientId) {
        reject(
          'Missing Google Drive OAuth client ID. Add one in Stylebot Sync options.'
        );
        return;
      }

      resolve(clientId);
    });
  });

const extractAccessToken = (redirectUri: string) => {
  const m = redirectUri.match(/[#?](.*)/);

  if (!m || m.length < 1) {
    return null;
  }

  const params = new URLSearchParams(m[1].split('#')[0]);
  return params.get('access_token');
};

/**
 * Validate the token contained in redirectURL.
 * This follows essentially the process here:
 * https://developers.google.com/identity/protocols/OAuth2UserAgent#tokeninfo-validation
 * - make a GET request to the validation URL, including the access token
 * - if the response is 200, and contains an "aud" property, and that property
 * matches the clientID, then the response is valid
 * - otherwise it is not valid
 * Note that the Google page talks about an "audience" property, but in fact
 * it seems to be "aud".
 */
const validate = async (
  clientId: string,
  redirectURL?: string
): Promise<AccessToken> => {
  if (!redirectURL) {
    throw 'Authorization failure';
  }

  const accessToken = extractAccessToken(redirectURL);
  if (!accessToken) {
    throw 'Authorization failure';
  }

  const validationBaseURL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  const validationURL = `${validationBaseURL}?access_token=${accessToken}`;
  const validationRequest = new Request(validationURL, {
    method: 'GET',
  });

  const response = await fetch(validationRequest);
  if (response.status != 200) {
    throw 'Token validation error';
  }

  const json = (await response.json()) as { aud: string };
  if (json.aud && json.aud === clientId) {
    return accessToken;
  }

  throw 'Token validation error';
};

const authorize = (clientId: string): Promise<string | undefined> => {
  return new Promise(resolve => {
    const redirectURL = chrome.identity.getRedirectURL();
    console.debug(
      `[${new Date().toISOString()}] Extension redirectURL:`,
      redirectURL
    );
    const scopes = ['https://www.googleapis.com/auth/drive.file'];

    let authURL = 'https://accounts.google.com/o/oauth2/auth';
    authURL += `?client_id=${encodeURIComponent(clientId)}`;
    authURL += `&response_type=token`;
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;

    return chrome.identity.launchWebAuthFlow(
      {
        interactive: true,
        url: authURL,
      },
      responseURL => resolve(responseURL)
    );
  });
};

export default async (): Promise<AccessToken> => {
  const clientId = await getGoogleDriveClientId();
  const redirectURL = await authorize(clientId);
  return validate(clientId, redirectURL);
};
