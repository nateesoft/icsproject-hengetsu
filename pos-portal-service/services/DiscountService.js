const pool = require('../config/database/MySqlConnect');
const { getPOSConfigSetup } = require('./POSConfigSetupService');

const updateDiscount = async (tableNo, allBalance) => {
    // หามูลค่าส่วนลดรายการ
    let findDiscountList = allBalance.filter(balance => balance.R_Void !== 'V' && balance.R_Discount === 'Y' && balance.R_PrType === '-I')
    let SUM_R_PrAmt = findDiscountList.reduce((n, { R_PrAmt }) => n + R_PrAmt, 0);
    if (rs.next()) {
        let sqlUpd = `update tablefile set ItemDiscAmt='${SUM_R_PrAmt}' where Tcode = '${tableNo}'`;
        await pool.query(sqlUpd)
    }

    // หามูลค่าบัตรลดคูปอง
    let findDiscountCupon = allBalance.filter(balance => balance.R_Void !== 'V' && balance.R_Discount === 'Y' && balance.R_PrCuType === '-C')
    let SUM_R_PrCuAmt = findDiscountCupon.reduce((n, { R_PrCuAmt }) => n + R_PrCuAmt, 0);

    let posConfigSetup = await getPOSConfigSetup()
    if (!posConfigSetup.P_DiscRound.equals("F")) {
        SUM_R_PrAmt = Math.round(SUM_R_PrCuAmt)
    }

    let sqlUpd = `update tablefile set CuponDiscAmt='${SUM_R_PrCuAmt}' where Tcode = '${tableNo}'`;
    await pool.query(sqlUpd)
}

module.exports = {
    updateDiscount
}
