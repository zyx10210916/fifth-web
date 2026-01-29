const TokenKey = 'Authorization';
const RefreshTokenKey = 'Refresh-Token';
const TokenPrefix = 'Bearer ';
const isLogin = () => {
  return !!localStorage.getItem(TokenKey);
};
const getToken = () => {
  return localStorage.getItem(TokenKey);
};
const setToken = (token: string) => {
  localStorage.setItem(TokenKey, token);
};
const getRefreshToken = () => localStorage.getItem(RefreshTokenKey);
const setRefreshToken = (token: string) => localStorage.setItem(RefreshTokenKey, token);
const clearToken = () => {
  localStorage.removeItem(TokenKey);
  localStorage.removeItem(RefreshTokenKey);
};
export { TokenPrefix, isLogin, getToken, setToken, getRefreshToken, setRefreshToken, clearToken };
