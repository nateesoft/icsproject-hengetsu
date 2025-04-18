const pool = require('../../config/database')
const { generateUUID } = require('../../utils/StringUtil')
const { mappingResultDataList } = require('../../utils/ConvertThai')

const getMenuSetup = async () => {
    const sql = `SELECT * FROM menu_setup where menu_type='product'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const searchMenuSetup = async (search) => {
    const sql = `SELECT * FROM menu_setup 
        where menu_type='product' 
        and (menu_name like '%${search}%' or menu_code like '%${search}%')`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const createMenuSetupRef = async listPayload => {
    listPayload && listPayload.forEach(async (payload) => {
        await createMenuSetup(payload)
    })
}

const createMenuSetup = async (payload) => {
    const id = generateUUID();
    const menu_code = payload.menu_code || '';
    const menu_name = payload.menu_name || '';
    const menu_number = payload.menu_number || '';
    const menu_type = payload.menu_type || 'product';
    const menu_status = payload.menu_status || 'deactive';
    const show_list_menu = payload.show_list_menu || 'N';
    const ref_menu = payload.ref_menu || '';
    const auto_select = payload.auto_select || 'N';
    const can_change = payload.can_change || 'N';
    const min_count_set = payload.min_count_set || 0;
    const max_count_set = payload.max_count_set || 0;
    const free = payload.free || 'N';
    const percent_discount = payload.percent_discount || 0;
    const manual_discount = payload.manual_discount || 0;
    const image_url = payload.image_url || '';
    const tab_group = payload.tab_group || '';
    const menu_price = payload.menu_price || 0;
    const product_group = payload.product_group || '';
    const manual_price = payload.manual_price || 'N'

    const sql = `INSERT INTO menu_setup 
        (id, menu_code, menu_name, menu_number, menu_type, menu_status, show_list_menu, 
        ref_menu, auto_select, can_change, min_count_set, max_count_set, free, 
        percent_discount, manual_discount, image_url, tab_group, menu_price, product_group, manual_price)
        VALUES('${id}','${menu_code}','${menu_name}','${menu_number}','${menu_type}','${menu_status}','${show_list_menu}',
        '${ref_menu}','${auto_select}','${can_change}','${min_count_set}','${max_count_set}','${free}',
        '${percent_discount}','${manual_discount}','${image_url}','${tab_group}','${menu_price}','${product_group}','${manual_price}')`;
    const results = await pool.query(sql)
    return results
}

const getMenuSetupAll = async () => {
    const sql = `SELECT * FROM menu_setup`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}
const getMenuTabs = async () => {
    const sql = `SELECT * FROM menu_tabs`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getOptionalByMenuCode = async (menuCode) => {
    const sql = `SELECT * FROM menu_setup where menu_type='optional' and ref_menu='${menuCode}'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getMenuSetupByMenuCode = async (menuCode) => {
    const sql = `SELECT * FROM menu_setup where menu_type='product' and menu_code='${menuCode}'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

module.exports = {
    getMenuSetup,
    getMenuSetupAll,
    getOptionalByMenuCode,
    getMenuSetupByMenuCode,
    createMenuSetup,
    createMenuSetupRef,
    getMenuTabs,
    searchMenuSetup
}
