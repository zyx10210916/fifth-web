import { get, post } from '@/utils/http/axios';
var URL;
(function (URL) {
    URL["login"] = "/user/login";
    URL["logout"] = "/user/logout";
    URL["profile"] = "/api/api-user/user/org/osUser/getLoginUserAndMenu";
    URL["token"] = "/api/api-uaa/oauth/user/token";
})(URL || (URL = {}));
const getUserProfile = async () => get({
    url: URL.profile,
    headers: {
        'needToken_': 'true'
    }
});
const login = async (data) => post({ url: URL.login, data });
const logout = async () => post({ url: URL.logout });
const getToken = async (data) => {
    return post({
        url: URL.token,
        data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'needToken_': 'false'
        }
    });
};
export { getUserProfile, logout, login, getToken };
//# sourceMappingURL=index.js.map