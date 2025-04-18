const pool = require('../config/database/MySqlConnect');
const { mappingResultDataList } = require('../utils/ConvertThai');
require('../utils/StringUtil');

const getVoidMsg = async () => {
    const sql = `select * from voidmsg order by VCode`;
    const results = await pool.query(sql)
    
    return mappingResultDataList(results)
}

module.exports = {
    getVoidMsg
}
