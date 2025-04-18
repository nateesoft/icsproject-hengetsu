const pool = require('../config/database/MySqlConnect')
require('../utils/StringUtil')
const { mappingResultDataList, mappingResultData } = require('../utils/ConvertThai')

const getAllTerminal = async () => {
    const sql = `select * from poshwsetup`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getAllData = async () => {
    const sql = `select * from poshwsetup limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
    }
    return null
}

const getDataByMacno = async (macno) => {
    const sql = `select * from poshwsetup where Terminal='${macno}' limit 1`
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
    }
    return null
}

const getBillNoByMacno = async (macno) => {
    const sql = `select * from poshwsetup where Terminal='${macno}' limit 1`
    const results = await pool.query(sql)
    if (results.length > 0) {
        return mappingResultData(results)
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
