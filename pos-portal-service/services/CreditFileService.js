const pool = require('../config/database/MySqlConnect');
const { mappingResultDataList, mappingResultData } = require('../utils/ConvertThai');

const getData = async () => {
    const sql = `select * from creditfile order by CrCode`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getDataByCrCode = async (CrCode) => {
    const sql = `select * from creditfile where CrCode='${CrCode}'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
    }
    return null
}

module.exports = {
    getData,
    getDataByCrCode
}
