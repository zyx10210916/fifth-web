import { buniscGetData } from '@/api/data-processing/index';
export const useFormHooks = () => {
    const listOptions = [];
    const getListOptions = async () => {
        try {
            const getDataData = {
                pageNo: 1,
                pageSize: 100,
            };
            const res = await buniscGetData(getDataData);
            const resData = res.data;
            if (resData && resData.length) {
                const seen = new Set();
                resData.forEach((item) => {
                    const tableName = item.TABLE_NAME;
                    const tableNum = item.TABLE_NUM;
                    if (!seen.has(tableName)) {
                        seen.add(tableName);
                        listOptions.push({ label: `${tableNum} ${tableName}`, value: item.ID_, code: item.TABLE_CODE });
                    }
                });
                return listOptions;
            }
        }
        catch (error) {
            console.log(error);
        }
    };
    return {
        getListOptions,
    };
};
//# sourceMappingURL=useFormHooks.js.map