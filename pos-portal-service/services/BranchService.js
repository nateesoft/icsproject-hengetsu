const pool = require('../config/database/MySqlConnect')
const { ASCII2Unicode } = require('../utils/StringUtil');

const getBranch = async () => {
    const sql = `select * from branch limit 1`;
    const results = await pool.query(sql)
    const mappingResult = results.map((item, index) => {
        return { ...item, Name: ASCII2Unicode(item.Name) }
    })
    return mappingResult[0]
}

module.exports = {
    getBranch
}
