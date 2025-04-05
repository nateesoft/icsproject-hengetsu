const pool = require('../config/database/MySqlConnect')

const getStkFile = async () => {
    const sql = `select * from stkfile`;
    const results = await pool.query(sql)
    return results
}

const getStkFileByBPCode = async (BPCode) => {
    const sql = `select * from stkfile where BPCode='${BPCode}'`;
    const results = await pool.query(sql)
    return results
}

module.exports = {
    getStkFile,
    getStkFileByBPCode
}
