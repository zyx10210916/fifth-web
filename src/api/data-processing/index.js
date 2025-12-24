import { post } from '@/utils/http/axios';
export const listConfig = {
    legalList: 'company_legal_main_economy_indicator_list',
    employeesSituationList: 'unit_employees_base_case_list',
    unitSituationList: 'unit_base_situation_list',
    employeesWagesList: 'employees_and_total_wages_list',
    inquiryUnitSituationList: 'inquiry_unit_base_cases_list',
};
var URL;
(function (URL) {
    URL["baseFormBoList"] = "/api/api-form/form/core/formBoList";
    URL["getData"] = "api/api-form/form/core/formBoList/data_template_list/getData?single=false";
    URL["buniscGetData"] = "api/api-form/form/core/formBoList/bunisc_data_table_list/getData?single=false";
    URL["indexGetData"] = "api/api-form/form/core/formBoList/bunisc_tables_columns_list/getData?single=false";
    URL["findDataQueryPage"] = "api/api-form/form/fifth/dataquery/findDataQueryPage";
    URL["professionalList"] = "api/api-form/form/core/formBoList/professional_list/getData?single=false";
    URL["areaList"] = "api/api-form/form/core/formBoList/area_list/getData?single=false";
    URL["dataQueryTableList"] = "/api/api-form/form/core/formBoList/data_query_table_list/getData?single=false";
    URL["ListCol"] = "/api/api-form/form/core/formSolution/getByAlias?alias=bunisc_data_table";
    URL["derivativeIndicatorsList"] = "/api/api-form/form/core/formBoList/derivative_indicators_list/getData?single=false";
    URL["saveDerivativeIndicator"] = "/api/api-form/form/core/formSolution/saveForm";
})(URL || (URL = {}));
const getData = async (data) => post({ url: URL.getData, data });
const buniscGetData = async (data) => post({ url: URL.buniscGetData, data });
const indexGetData = async (data) => post({ url: URL.indexGetData, data });
const findDataQueryPage = async (data) => post({ url: URL.findDataQueryPage, data });
const professionalList = async (data) => post({ url: URL.professionalList, data });
const areaList = async (data) => post({ url: URL.areaList, data });
const dataQueryTableList = async (data) => post({ url: URL.dataQueryTableList, data });
const getTableColumnsApi = async (params) => {
    const path = `${URL.ListCol}&${new URLSearchParams(params).toString()}`;
    return post({ url: path });
};
const quickSummaryApi = async (data) => {
    return post({
        url: '/api/api-form/form/fifth/quick_summary/findQuickSumary',
        data,
    });
};
const crossSummaryApi = async (data) => {
    return post({
        url: '/api/api-form/form/fifth/cross_summary/findCrossSumary',
        data,
    });
};
const getDerivativeIndicatorsList = async (params) => {
    return post({
        url: URL.derivativeIndicatorsList,
        data: params
    });
};
const saveDerivativeIndicator = async (data) => {
    const requestData = {
        setting: {
            action: "save",
            alias: "derivative_indicators"
        },
        data: data
    };
    return post({
        url: URL.saveDerivativeIndicator,
        data: requestData
    });
};
export { getData, buniscGetData, indexGetData, findDataQueryPage, professionalList, areaList, dataQueryTableList, getTableColumnsApi, quickSummaryApi, crossSummaryApi, getDerivativeIndicatorsList, saveDerivativeIndicator };
//# sourceMappingURL=index.js.map