const pool = require('../config/database/MySqlConnect');
const { mappingResultData } = require('../utils/ConvertThai');

const getPOSConfigSetup = async () => {
    const sql = `select * from posconfigsetup limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
    }
    return null
}

module.exports = {
    getPOSConfigSetup
}
