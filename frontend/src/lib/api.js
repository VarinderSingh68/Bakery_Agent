const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getLocalBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8001';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
  return `${protocol}//${hostname}:8001`;
};

const buildApiUrl = () => {
  const explicitApiUrl = process.env.REACT_APP_API_URL;
  if (explicitApiUrl) {
    return trimTrailingSlash(explicitApiUrl);
  }

  const backendUrl = process.env.REACT_APP_BACKEND_URL || getLocalBackendUrl();
  const normalizedBackendUrl = trimTrailingSlash(backendUrl);

  return normalizedBackendUrl.endsWith('/api')
    ? normalizedBackendUrl
    : `${normalizedBackendUrl}/api`;
};

const API_URL = buildApiUrl();

export const getBackendUrl = () => API_URL.replace(/\/api$/, '');

export const getGoogleRedirectUri = () => {
  const configuredRedirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;

  if (configuredRedirectUri) {
    return trimTrailingSlash(configuredRedirectUri);
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return `${trimTrailingSlash(window.location.origin)}/auth/callback`;
  }

  return 'http://localhost:3001/auth/callback';
};

export default API_URL;
