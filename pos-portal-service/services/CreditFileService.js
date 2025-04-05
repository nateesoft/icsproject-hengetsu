const pool = require('../config/database/MySqlConnect')

const getData = async () => {
    const sql = `select * from creditfile order by CrCode`;
    const results = await pool.query(sql)
    return results
}

const getDataByCrCode = async (CrCode) => {
    const sql = `select * from creditfile where CrCode='${CrCode}'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

module.exports = {
    getData,
    getDataByCrCode
}
