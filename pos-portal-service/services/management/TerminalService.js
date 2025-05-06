const pool = require('../../config/database');

const getCashierPrinterName = async (macno) => {
    const sql = `select * from terminal where macno='${macno}'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return {}
}


module.exports = {
    getCashierPrinterName,
}
