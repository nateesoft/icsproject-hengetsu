const pool = require("../config/database/MySqlConnect")

const getAllProtab = async (pluCode) => {
  const sql = `select procode,prodesc,pdate1,pdate2,ptype,psum1 from protab`
  const results = await pool.query(sql)
  return results
}

const getAllBalanceCanPro = async (tableNo) => {
  const sql = `select * from balance 
    where R_Table='${tableNo}' 
    and R_Discount='Y' 
    and R_Void <> 'V' 
    group by R_PRType 
    order by R_PluCode, R_Index`
  const results = await pool.query(sql)
  return results
}

const updatePromotion = async (tableNo, allBalance) => {
  // clear temp promotion
  await pool.query(`delete from tpromotion2 where TCode='${tableNo}'`)
  await pool.query(`delete from tpromotion3 where TCode='${tableNo}'`)
  await pool.query(`delete from tpromotion4 where TCode='${tableNo}'`)
}

module.exports = {
  getAllProtab,
  updatePromotion,
  getAllBalanceCanPro
}
