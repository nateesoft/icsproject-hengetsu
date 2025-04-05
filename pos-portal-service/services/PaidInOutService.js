const pool = require('../config/database/MySqlConnect');
const { getMoment } = require('../utils/MomentUtil');

const PAID_IN_TYPE = "I"
const PAID_OUT_TYPE = "O"

const createPaidIn = async ({ macno, cashier, paidinAmt }) => {
    const sql = `insert into paidiofile 
                (date, time, cashier, terminal, flage, paidinamt, paidoutamt) 
                values ('${getMoment().format('YYYY-MM-DD')}', '${getMoment().format('HH:mm:ss')}', '${cashier}', '${macno}', '${PAID_IN_TYPE}', '${paidinAmt}', '0.00')`;
    const results = await pool.query(sql)
    return results
}

const createPaidOut = async ({ macno, cashier, paidoutAmt, reason }) => {
    const sql = `insert into paidiofile 
                (date, time, cashier, terminal, flage, paidinamt, paidoutamt, reson) 
                values ('${getMoment().format('YYYY-MM-DD')}', '${getMoment().format('HH:mm:ss')}', '${cashier}', '${macno}', '${PAID_OUT_TYPE}', '0.00', '${paidoutAmt}', '${reason}')`;
    const results = await pool.query(sql)
    return results
}

module.exports = {
    createPaidIn,
    createPaidOut
}
