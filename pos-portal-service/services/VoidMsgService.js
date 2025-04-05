const pool = require('../config/database/MySqlConnect')
const { ASCII2Unicode } = require('../utils/StringUtil');

const getVoidMsg = async () => {
    const sql = `select * from voidmsg order by VCode`;
    const results = await pool.query(sql)
    const mappingResult = results.map((item, index) => {
        return { ...item, VName: ASCII2Unicode(item.VName) }
    })
    return mappingResult
}

module.exports = {
    getVoidMsg
}
