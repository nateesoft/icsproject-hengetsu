const pool = require('../config/database/MySqlConnect')
const { mappingResultData } = require('../utils/ConvertThai');

const getBranch = async () => {
    const sql = `select * from branch limit 1`;
    const results = await pool.query(sql)
    return mappingResultData(results)
}

module.exports = {
    getBranch
}
