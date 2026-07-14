const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const buildApiUrl = () => {
  const explicitApiUrl = process.env.REACT_APP_API_URL;
  if (explicitApiUrl) {
    return trimTrailingSlash(explicitApiUrl);
  }

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8001';
  const normalizedBackendUrl = trimTrailingSlash(backendUrl);

  return normalizedBackendUrl.endsWith('/api')
    ? normalizedBackendUrl
    : `${normalizedBackendUrl}/api`;
};

const API_URL = buildApiUrl();
export default API_URL;
