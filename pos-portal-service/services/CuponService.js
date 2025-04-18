const pool = require("../config/database/MySqlConnect")
const { mappingResultDataList } = require("../utils/ConvertThai")
const { getMoment } = require("../utils/MomentUtil")
require("../utils/StringUtil")

const getDataCupon = async () => {
  const date = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" })
  const EE = formatter.format(date) // "Sun", "Mon", etc.

  const sql = `select * from cupon 
      where (curdate()>=cubegin) and (curdate()<=cuend) 
      and (cutype is not null) and (cucode is not null) 
      and CuStrDay like '%${EE}%' 
      and ChkMember='N' 
      order by cutype,cucode`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const saveData = async (payload, tableNo, macNo, cashier, netTotalAmount) => {
  const { CuCode, CuDisc, CuDiscBath, qty } = payload
  const time = getMoment().format('HH:mm')
  const R_Index = tableNo+CuCode
  let CuTotal = 0
  let CuAmt = 0
  if(CuDisc>0){
    CuAmt = (CuDisc * netTotalAmount / 100) * qty
  }else{
    CuAmt = CuDiscBath * qty
  }
  CuTotal = CuAmt
  const sql = `INSERT INTO tempcupon
    (R_Index, R_Table, Terminal, Cashier, \`Time\`, 
    CuCode, CuQuan, CuAmt, CuTotal, CuDisc, 
    CuRedule, CuPayment, CuTextCode, 
    CuTextComment, CuEntertainFlag, CuEntertainUser)
    VALUES('${R_Index}', '${tableNo}', '${macNo}', '${cashier}', '${time}', 
    '${CuCode}', ${qty}, ${CuAmt}, ${CuTotal}, ${CuDisc}, 
    0, 0, '', '', '', '');`
  await pool.query(sql)

  // update tablefile for cuponAmt
  const sql2 = `UPDATE tablefile set CuponDiscAmt='${CuAmt}' WHERE Tcode='${tableNo}'`
  const result = await pool.query(sql2)
  return result
}

const saveDataCupon = async (payload) => {
  const { cuponList, cashier, tableNo, macNo, netTotalAmount } = payload
  // clear tempcupon
  await pool.query(`delete from tempcupon where R_Table='${tableNo}'`)

  for (const cupon of cuponList) {
    await saveData(cupon, tableNo, macNo, cashier, netTotalAmount)
  }

  const sql = `select sum(CuAmt) CuAmt from tempcupon where R_Table='${tableNo}'`;
  const results = await pool.query(sql)
  if(results.length>0){
    return results[0]
  }else{
    return 0.00
  }
}

const addDataFromTemp = async (billNo, tableNo) => {
  const sql = `select * from tempcupon where R_Table='${tableNo}'`;
  const results = await pool.query(sql)
  let moveTemp = false
  
  for (const tempCupon of results) {
    const R_Index = billNo + "/" + tempCupon.CuCode

    const sql = `INSERT INTO t_cupon
      (R_Index, R_Refno, Terminal, Cashier, Time, CuCode, CuQuan, CuAmt, 
      Refund, CuTextCode, CuTextComment, SMS_Code, 
      B_UserEntertain, CuEntertainFlag, CuEntertainUser)
      VALUES('${R_Index}', '${billNo}', '${tempCupon.Terminal}', 
      '${tempCupon.Cashier}', '${tempCupon.Time}', '${tempCupon.CuCode}', ${tempCupon.CuQuan}, ${tempCupon.CuAmt}, 
      '', '', '', '', 0, '', '');`
    await pool.query(sql)
    moveTemp = true
  }

  if(moveTemp === true){
    // clear temp cupon
    await pool.query(`delete from tempcupon where R_Table='${tableNo}'`)
  }
}

const summaryCuponDiscountAmount = async (tableNo) => {
    const sql = `select sum(CuAmt) CuAmt from tempcupon where R_Table='${tableNo}'`;
    const results = await pool.query(sql)
    if(results.length>0){
      return results[0]
    }

    return 0.00
}

module.exports = {
  getDataCupon,
  saveDataCupon,
  summaryCuponDiscountAmount,
  addDataFromTemp
}
