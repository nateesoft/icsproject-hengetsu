const pool = require('../config/database/MySqlConnect')
const { ASCII2Unicode, PrefixZeroFormat } = require('../utils/StringUtil')

const getAllTerminal = async () => {
    const sql = `select * from poshwsetup`;
    const results = await pool.query(sql)
    return results
}

const getAllData = async () => {
    const sql = `select * from poshwsetup limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const getDataByMacno = async (macno) => {
    const sql = `select * from poshwsetup where Terminal='${macno}' limit 1`
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const getBillNoByMacno = async (macno) => {
    const sql = `select * from poshwsetup where Terminal='${macno}' limit 1`
    const results = await pool.query(sql)
    let RunningNumber = ""
    if (results.length > 0) {
        RunningNumber = PrefixZeroFormat(results[0].ReceNo1, 7)

        return {...results[0], Footting3: ASCII2Unicode(results[0].Footting3)}
    }
    return null
}

const updateNextBillNo = async (macno) => {
    const sql = `UPDATE poshwsetup set receno1=receno1+1 where terminal='${macno}'`
    pool.query(sql, (err, results) => {
        res.status(200).json({ status: "update next billno success" })
    })
    return true
}

module.exports = {
    getDataByMacno,
    getAllData,
    updateNextBillNo,
    getBillNoByMacno,
    getAllTerminal
}
