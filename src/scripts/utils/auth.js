import { getActiveRoute } from '../routes/url-parser';
import config from '../config';

const ACCESS_TOKEN_KEY = config.ACCESS_TOKEN_KEY;

export function getAccessToken() {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (accessToken === 'null' || accessToken === 'undefined') {
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error('getAccessToken: error:', error);
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('putAccessToken: error:', error);
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('removeAccessToken: error:', error);
    return false;
  }
}

const unauthenticatedRoutesOnly = ['/login', '/register'];
export function checkUnauthenticatedRouteOnly(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  // Jika user sudah login, tidak boleh akses login/register
  if (isLogin && unauthenticatedRoutesOnly.includes(url)) {
    if (url !== '/') {
      location.hash = '#/';
    }
    return null;
  }

  return page;
}

export function checkAuthenticatedRoute(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  // Jika user belum login, tidak boleh akses halaman ini
  if (!isLogin) {
    if (url !== '/login') {
      location.hash = '#/login';
    }
    return null;
  }

  return page;
}


export function getLogout() {
  removeAccessToken();
}
