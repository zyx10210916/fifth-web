import { resolve } from 'path';
const fs = require('fs');
function pathResolve(dir) {
    return resolve(process.cwd(), '.', dir);
}
export const getFolder = (path) => {
    const components = [];
    const files = fs.readdirSync(path);
    files.forEach(function (item) {
        const stat = fs.lstatSync(path + '/' + item);
        if (stat.isDirectory() === true && item != 'components') {
            components.push(path + '/' + item);
            components.push(pathResolve(path + '/' + item));
        }
    });
    return components;
};
//# sourceMappingURL=index.js.map