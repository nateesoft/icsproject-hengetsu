const pool = require('../config/database/MySqlConnect');
const { getMoment } = require('../utils/MomentUtil');
const { mappingResultDataList } = require('../utils/ConvertThai');

const getTempGiftList = async (macno) => {
    const sql = `select * from tempgift where MacNo='${macno}'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getTGiftList = async (refno) => {
    const sql = `select * from t_gift where refno='${refno}'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const createTempGift = async (payload) => {
    const { MacNo='', giftbarcode='', gifttype='', giftprice='', 
        giftmodel='', giftlot='', giftexp='', giftcode='', 
        giftno='', giftamt = 0 } = payload
    const sql = `INSERT tempgift
        (MacNo, giftbarcode, gifttype, giftprice, giftmodel, giftlot, giftexp, giftcode, 
        giftno, giftamt) 
        VALUES('${MacNo}', '${giftbarcode}', '${gifttype}', '${giftprice}', 
        '${giftmodel}', '${giftlot}', '${giftexp}', '${giftcode}', 
        '${giftno}', ${giftamt})`;
    const results = await pool.query(sql)
    return results
}

const createTGift = async (payload) => {
    const S_Date = getMoment().format('YYYY-MM-DD')
    const { macNo='', refno='', cashier='', giftbarcode='', 
        gifttype='', giftprice='', giftmodel='', giftlot='', giftexp='', 
        giftcode='', giftno='', giftamt=0, fat='' } = payload
    const sql = `INSERT INTO t_gift
        (ondate, macNo, refno, cashier, giftbarcode, gifttype, giftprice, giftmodel, 
        giftlot, giftexp, giftcode, giftno, giftamt, fat)
        VALUES('${S_Date}', '${macNo}', '${refno}', '${cashier}', '${giftbarcode}', 
        '${gifttype}', '${giftprice}', '${giftmodel}', '${giftlot}', '${giftexp}', 
        '${giftcode}', '${giftno}', ${giftamt}, '${fat}')`;
    const results = await pool.query(sql)
    return results
}

const deleteTempGiftAll = async (macno) => {
    const sql = `delete from tempgift where MacNo='${macno}'`;
    const results = await pool.query(sql)
    return results
}

const deleteTempGiftByGiftNo = async (macno, giftNo) => {
    const sql = `delete from tempgift 
        where giftno='${giftNo}' and MacNo='${macno}'`;
    const results = await pool.query(sql)
    return results
}

module.exports = {
    getTempGiftList,
    getTGiftList,
    createTempGift,
    createTGift,
    deleteTempGiftAll,
    deleteTempGiftByGiftNo
}
