export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {

  return new Promise((resolve) => setTimeout(resolve, time));
}

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

export function saveAuthToken(token) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}