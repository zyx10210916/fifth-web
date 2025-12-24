import { getTableColumnsApi } from '@/api/data-processing/index';
export const useList = () => {
    const loadListData = async (listKey) => {
        try {
            const params = {
                pk: listKey,
                action: 'detail',
            };
            const res = await getTableColumnsApi(params);
            const indexs = res.data.sub__table_columns.map((item) => ({
                id: item.column_code,
                name: item.column_name,
            }));
            return indexs;
        }
        catch (error) {
            console.log(error);
        }
    };
    return {
        loadListData,
    };
};
//# sourceMappingURL=useListHooks.js.map