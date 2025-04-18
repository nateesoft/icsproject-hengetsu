const pool = require('../config/database/MySqlConnect');
const { mappingResultData } = require('../utils/ConvertThai');

const getDataCompany = async () => {
    const sql = `select * from company limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
    }
    return null
}

module.exports = {
    getDataCompany
}
