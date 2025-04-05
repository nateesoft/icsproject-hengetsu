const pool = require('../config/database/MySqlConnect');
const { getMoment } = require('../utils/MomentUtil');

const getTempCredit = async (macno, tableNo) => {
    const sql = `select * from tempcredit where Mac_No='${macno}' and Ref_No='${tableNo}'`;
    const results = await pool.query(sql)
    return results
}

const getTCreditList = async (refNo) => {
    const sql = `select * from t_credit where refno='${refNo}'`;
    const results = await pool.query(sql)
    return results
}

const deleteTempCredit = async ({ Terminal, Ref_No, CrCode }) => {
    const sql = `delete from tempcredit 
        where Mac_No='${Terminal}' 
        and Ref_No='${Ref_No}' 
        and CrCode='${CrCode}'`;
    const results = await pool.query(sql)
    return results
}

const emptyTempCredit = async (Mac_No) => {
    const sql = `delete from tempcredit where Mac_No='${Mac_No}'`;
    const results = await pool.query(sql)
    return results
}

const createTempCredit = async (payload) => {
    const S_Date = getMoment().format('YYYY-MM-DD')
    const { MacNo, RefNo, CrCode, CrNumber, CrApprove, Terminal,
        CrCreditAmount, CrChargePercent, CrChargeAmount } = payload
    const sql = `INSERT INTO tempcredit 
            (Mac_No,S_Date,Terminal,Ref_No,CrCode,CrId,CrApp,CrAmt,CrCharge,CrChargeAmount) 
            VALUES ('${MacNo}','${S_Date}','${Terminal}', '${RefNo}','${CrCode}',
            '${CrNumber}','${CrApprove}','${CrCreditAmount}','${CrChargePercent}','${CrChargeAmount}')`;
    const results = await pool.query(sql)
    return results
}

const createListTempCredit = async (tempCreditList) => {
    return tempCreditList.map(async temp => {
        return await createTempCredit(temp)
    })
}

const createCredit = async (payload, B_Refno, B_Cashier) => {
    const macno = payload.MacNo
    const ondate = getMoment().format('YYYY-MM-DD')
    const refno = B_Refno
    const CrCode = payload.CrCode
    const CardNo = payload.CrNumber
    const CrApp = payload.CrApprove
    const CrAmt = payload.CrCreditAmount
    const CrCharge = payload.CrChargePercent
    const CrChargeAmount = payload.CrChargeAmount
    const sql = `INSERT INTO t_credit 
            (macno,ondate,refno,CrCode,CardNo,CrApp,CrAmt,CrCharge,CrChargeAmount,cashier) 
            VALUES ('${macno}','${ondate}','${refno}', '${CrCode}','${CardNo}',
            '${CrApp}','${CrAmt}','${CrCharge}','${CrChargeAmount}', '${B_Cashier}')`;
    const results = await pool.query(sql)
    return results
}

const createListCredit = async (creditList, B_Refno, B_Cashier) => {
    return creditList.map(async item => {
        return await createCredit(item, B_Refno, B_Cashier)
    })
}

const deleteListTempCredit = async (creditList, tableNo) => {
    return creditList.map(async item => {
        return await deleteTempCredit(
            {
                Terminal: item.MacNo,
                Ref_No: tableNo,
                CrCode: item.CrCode
            }
        )
    })
}

module.exports = {
    getTempCredit,
    createTempCredit,
    createListTempCredit,
    deleteTempCredit,
    emptyTempCredit,
    createListCredit,
    deleteListTempCredit,
    getTCreditList
}
