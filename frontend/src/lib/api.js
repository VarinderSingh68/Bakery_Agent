const normalizeLocalApiUrl = (rawUrl) => {
  if (!rawUrl || typeof window === 'undefined') {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const currentHost = window.location.hostname;
    const isCurrentLocalHost = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const isConfiguredLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (isCurrentLocalHost && isConfiguredLocalHost) {
      parsed.hostname = currentHost;
      return parsed.toString().replace(/\/$/, '');
    }

    return rawUrl.replace(/\/$/, '');
  } catch {
    return rawUrl.replace(/\/$/, '');
  }
};

const getDefaultBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // Local development via CRA dev server proxy to backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (process.env.REACT_APP_API_URL) {
        return normalizeLocalApiUrl(process.env.REACT_APP_API_URL);
      }

      if (process.env.REACT_APP_BACKEND_URL) {
        return `${normalizeLocalApiUrl(process.env.REACT_APP_BACKEND_URL)}/api`;
      }

      return '/api';
    }

    if (process.env.REACT_APP_API_URL) {
      return normalizeLocalApiUrl(process.env.REACT_APP_API_URL);
    }

    if (process.env.REACT_APP_BACKEND_URL) {
      return `${normalizeLocalApiUrl(process.env.REACT_APP_BACKEND_URL)}/api`;
    }

    // Production / same-origin in deployed environments
    return `${window.location.protocol}//${window.location.host}/api`;
  }

  return process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '/api';
};

const API_URL = getDefaultBackendUrl();

if (typeof window !== 'undefined') {
  console.debug('[API_URL]', API_URL);
}

export default API_URL;
