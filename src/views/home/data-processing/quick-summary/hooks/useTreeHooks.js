import { getTableColumnsApi } from '@/api/data-processing/index';
export const useTree = () => {
    const loadTreeData = async (listKey) => {
        try {
            const params = {
                pk: listKey,
                action: 'detail',
            };
            const res = await getTableColumnsApi(params);
            const listNum = res.data.table_num;
            const tableCode = res.data.table_code;
            const indexs = res.data.sub__table_columns.map((item) => ({
                title: item.column_name,
                key: item.column_code,
                listNum: listNum,
                tablecode: tableCode,
                originalData: item
            }));
            const newData = [
                {
                    title: `${listNum} ${res.data.table_name}`,
                    key: '0-0',
                    tablecode: tableCode,
                    children: indexs,
                },
            ];
            return newData;
        }
        catch (error) {
            console.log(error);
        }
    };
    return {
        loadTreeData,
    };
};
//# sourceMappingURL=useTreeHooks.js.map