const TokenKey = 'Authorization';
const TokenPrefix = 'Bearer ';
const isLogin = () => {
    return !!localStorage.getItem(TokenKey);
};
const getToken = () => {
    return localStorage.getItem(TokenKey);
};
const setToken = (token) => {
    localStorage.setItem(TokenKey, token);
};
const clearToken = () => {
    localStorage.removeItem(TokenKey);
};
export { TokenPrefix, isLogin, getToken, setToken, clearToken };
//# sourceMappingURL=auth.js.map