const pool = require("../config/database/MySqlConnect")
const { getMoment } = require("../utils/MomentUtil")

const getTableOnAction = async (date) => {
  let sql = `select R_Date, R_Table,sum(R_Total) R_Total,R_Void,TCurTime,TCustomer 
                from balance left join tablefile t on balance.r_table=t.tcode 
                where r_void<>'V' `
  if (date) {
    sql = sql + ` and R_Date ='${date}' `
  }
  sql = sql + ` group by r_date, r_table, r_void `
  const results = await pool.query(sql)
  let sql2 = `select sum(R_Total) R_Total 
        from balance 
        where r_void<>'V' `
  if (date) {
    sql2 = sql2 + ` and R_Date ='${date}' `
  }
  const resultFooter = await pool.query(sql2)
  const reponse = {
    header: {},
    data: results,
    footer: {
      total: resultFooter[0].R_Total
    }
  }
  return reponse
}

const getTableOnActionList = async () => {
  const sql = `select b.Macno, R_Table, R_Date ,
                sum(R_Total) R_Total, R_Void, TCurTime, TCustomer 
                from balance b left join tablefile t on b.r_table=t.tcode 
                where b.r_void<>'V' 
                group by b.Macno, b.r_table, b.r_date, b.r_void`
  const results = await pool.query(sql)
  return results
}

const getTerminalByMacno = async (macno) => {
  const sql = `SELECT B_MacNo,
            SUM(B_Food) B_Food,
            SUM(B_Drink) B_Drink,
            SUM(B_Product) B_Product,
            SUM(B_Total) Dept_Sum,
            SUM(B_ServiceAmt) B_ServiceAmt,
            SUM(B_CrChargeAmt1) B_CrChargeAmt1,
            SUM(B_MemDiscAmt) B_MemDiscAmt,
            SUM(B_FastDiscAmt) B_FastDiscAmt,
            SUM(B_EmpDiscAmt) B_EmpDiscAmt,
            SUM(B_TrainDiscAmt) B_TrainDiscAmt,
            SUM(B_SubDiscAmt) B_SubDiscAmt,
            SUM(B_SubDiscBath) B_SubDiscBath,
            SUM(B_ProDiscAmt) B_ProDiscAmt,
            SUM(B_SpaDiscAmt) B_SpaDiscAmt,
            SUM(B_ItemDiscAmt) B_ItemDiscAmt,
            SUM(B_CuponDiscAmt) B_CuponDiscAmt,
            SUM(B_Earnest) B_Earnest,
            SUM(B_Entertain) B_Entertain,
            SUM(B_NetTotal) B_NetTotal,
            SUM(B_CrAmt1) B_CrAmt,
            SUM(B_AccrAmt) B_AccrAmt,
            SUM(B_Cash) B_Cash,
            SUM(B_GiftVoucher) B_GiftVoucher,
            SUM(B_NetVat) B_NetVat,
            SUM(B_NetNonVat) B_NetNonVat,
            SUM(B_Vat) B_Vat,
            SUM(B_Ton) B_Ton,
            SUM(B_Cust) B_Cust 
            FROM billno 
            WHERE B_OnDate='${getMoment().format("YYYY-MM-DD")}' 
            and B_Void <> 'V' 
            and B_MacNo ='${macno}' 
            group by (B_MacNo)`
  const results = await pool.query(sql)
  if (results.length > 0) {
    const sqlPaidIO = `select sum(PaidInAmt) PaidInAmt, sum(PaidOutAmt) PaidOutAmt 
                        from paidiofile 
                        where Terminal='${macno}' 
                        and Date='${getMoment().format("YYYY-MM-DD")}'`
    const resultsPaidIO = await pool.query(sqlPaidIO)
    let getPaidIO = {}
    if (resultsPaidIO.length > 0) {
      getPaidIO = resultsPaidIO[0]
    }

    const sqlETD = `SELECT B_ETD, count(*) Bill_Count, sum(B_Cust) B_Cust, sum(B_NetTotal) B_NetTotal 
                  FROM billno b WHERE b.B_OnDate='${getMoment().format(
                    "YYYY-MM-DD"
                  )}' 
                  and b.B_MacNo ='${macno}' GROUP BY B_ETD`
    const resultETDType = await pool.query(sqlETD)
    const E = resultETDType.filter((item) => item.B_ETD === "E")
    const T = resultETDType.filter((item) => item.B_ETD === "T")
    const D = resultETDType.filter((item) => item.B_ETD === "D")

    const initData = { Bill_Count: 0, B_Cust: 0, B_NetTotal: 0 }
    const sumTypeE = E.length > 0 ? E[0] : initData
    const sumTypeT = T.length > 0 ? T[0] : initData
    const sumTypeD = D.length > 0 ? D[0] : initData

    return {
      cashier: results[0],
      paidio: getPaidIO,
      sumTypeE,
      sumTypeT,
      sumTypeD
    }
  }
  return {}
}

const getTerminalByCashier = async (cashier) => {
  const sql = `SELECT B_Cashier,
            SUM(B_Food) B_Food,
            SUM(B_Drink) B_Drink,
            SUM(B_Product) B_Product,
            SUM(B_Total) Dept_Sum,
            SUM(B_ServiceAmt) B_ServiceAmt,
            SUM(B_CrChargeAmt1) B_CrChargeAmt1,
            SUM(B_MemDiscAmt) B_MemDiscAmt,
            SUM(B_FastDiscAmt) B_FastDiscAmt,
            SUM(B_EmpDiscAmt) B_EmpDiscAmt,
            SUM(B_TrainDiscAmt) B_TrainDiscAmt,
            SUM(B_SubDiscAmt) B_SubDiscAmt,
            SUM(B_SubDiscBath) B_SubDiscBath,
            SUM(B_ProDiscAmt) B_ProDiscAmt,
            SUM(B_SpaDiscAmt) B_SpaDiscAmt,
            SUM(B_ItemDiscAmt) B_ItemDiscAmt,
            SUM(B_CuponDiscAmt) B_CuponDiscAmt,
            SUM(B_Earnest) B_Earnest,
            SUM(B_Entertain) B_Entertain,
            SUM(B_NetTotal) B_NetTotal,
            SUM(B_CrAmt1) B_CrAmt,
            SUM(B_AccrAmt) B_AccrAmt,
            SUM(B_Cash) B_Cash,
            SUM(B_GiftVoucher) B_GiftVoucher,
            SUM(B_NetVat) B_NetVat,
            SUM(B_NetNonVat) B_NetNonVat,
            SUM(B_Vat) B_Vat,
            SUM(B_Ton) B_Ton,
            SUM(B_Cust) B_Cust 
            FROM billno 
            WHERE B_OnDate='${getMoment().format("YYYY-MM-DD")}' 
            and B_Void <> 'V' 
            and B_Cashier ='${cashier}' 
            group by (B_Cashier)`
  const results = await pool.query(sql)
  if (results.length > 0) {
    const sqlPaidIO = `select sum(PaidInAmt) PaidInAmt, sum(PaidOutAmt) PaidOutAmt 
                        from paidiofile 
                        where Cashier='${cashier}' 
                        and Date='${getMoment().format("YYYY-MM-DD")}'`
    const resultsPaidIO = await pool.query(sqlPaidIO)
    let getPaidIO = {}
    if (resultsPaidIO.length > 0) {
      getPaidIO = resultsPaidIO[0]
    }

    const sqlETD = `SELECT B_ETD, count(*) Bill_Count, sum(B_Cust) B_Cust, sum(B_NetTotal) B_NetTotal 
                  FROM billno b WHERE b.B_OnDate='${getMoment().format(
                    "YYYY-MM-DD"
                  )}' 
                  and b.B_Cashier ='${cashier}' GROUP BY B_ETD`
    const resultETDType = await pool.query(sqlETD)
    const E = resultETDType.filter((item) => item.B_ETD === "E")
    const T = resultETDType.filter((item) => item.B_ETD === "T")
    const D = resultETDType.filter((item) => item.B_ETD === "D")

    const initData = { Bill_Count: 0, B_Cust: 0, B_NetTotal: 0 }
    const sumTypeE = E.length > 0 ? E[0] : initData
    const sumTypeT = T.length > 0 ? T[0] : initData
    const sumTypeD = D.length > 0 ? D[0] : initData

    const sql1 = `select b.B_Cashier, count(*) bill_count, sum(b.B_NetTotal) B_NetTotal 
                from billno b where b.B_Void !='V' and b.B_Cashier ='${cashier}' 
                and b.B_OnDate = '${getMoment().format("YYYY-MM-DD")}'`
    const sql2 = `select b.B_Cashier, count(*) bill_count, b.B_Void, sum(b.B_NetTotal) B_NetTotal 
                from billno b where b.B_Void ='V' and b.B_Cashier ='${cashier}' 
                and b.B_OnDate = '${getMoment().format("YYYY-MM-DD")}'`

    const result1 = await pool.query(sql1)
    const result2 = await pool.query(sql2)

    return {
      cashier: results[0],
      paidio: getPaidIO,
      sumTypeE,
      sumTypeT,
      sumTypeD,
      receiptBill: result1[0],
      voidBill: result2[0]
    }
  }
  return {}
}

const getGroupName = (groupName) => {
  if (!groupName || "null" === groupName) {
    return ""
  }
  return " " + groupName || ""
}

const summaryETD = (results, dataList) => {
  let sumE = 0
  let sumT = 0
  let sumD = 0
  results.map((item) => {
    dataList.push({
      data1: item.R_Group + getGroupName(item.GroupName),
      data2: item.GroupName,
      data3: "",
      data4: ""
    })
    if (item.R_ETD === "E") {
      sumE += item.R_Total
      dataList.push({
        data1: "",
        data2: item.R_Total,
        data3: "0.00",
        data4: "0.00"
      })
    } else if (item.R_ETD === "T") {
      sumT += item.R_Total
      dataList.push({
        data1: "",
        data2: "0.00",
        data3: item.R_Total,
        data4: "0.00"
      })
    } else if (item.R_ETD === "D") {
      sumD += item.R_Total
      dataList.push({
        data1: "",
        data2: "0.00",
        data3: "0.00",
        data4: item.R_Total
      })
    }
  })

  return { sumE, sumT, sumD }
}

const getGroupPlu = async (
  macno1,
  macno2,
  cashier1,
  cashier2,
  groupCode1,
  groupCode2
) => {
  let sql = `SELECT ts.R_ETD, ts.R_Group, g.GroupName, 
            SUM(ts.R_Total) R_Total 
            FROM billno b 
            INNER JOIN t_sale ts on b.B_Refno =ts.R_Refno 
            LEFT JOIN groupfile g on ts.R_Group = g.GroupCode 
            WHERE ts.R_Date='${getMoment().format(
              "YYYY-MM-DD"
            )}' and ts.R_Void <> 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and ts.MacNo between '${macno1}' and '${macno2}' `
  }
  if (cashier1 && cashier2) {
    sql = sql + ` and ts.Cashier between '${cashier1}' and '${cashier2}' `
  }
  if (groupCode1 && groupCode2) {
    sql = sql + ` and ts.R_Group between '${groupCode1}' and '${groupCode2}' `
  }

  sql = sql + ` GROUP BY ts.R_ETD, ts.R_Group`
  const results = await pool.query(sql)
  const dataList = []

  // add group
  const { sumE, sumT, sumD } = summaryETD(results, dataList)

  // add summary data
  dataList.push({ data1: "Sum-TOTAL...", data2: "", data3: "", data4: "" })
  dataList.push({ data1: "", data2: sumE, data3: sumT, data4: sumD })
  return dataList
}

const getPluCode = async (
  macno1,
  macno2,
  cashier1,
  cashier2,
  groupCode1,
  groupCode2,
  pluCode
) => {
  let sql = `select ts.R_Group, g.GroupName, ts.R_PluCode, ts.R_PName,
        sum(ts.R_Quan) R_Quan, sum(R_Total) R_Total 
        from billno b 
        inner join t_sale ts on b.B_Refno =ts.R_Refno 
        left join groupfile g on ts.R_Group = g.GroupCode 
        where ts.R_Date='${getMoment().format(
          "YYYY-MM-DD"
        )}' and ts.R_Void <> 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and ts.MacNo between '${macno1}' and '${macno2}' `
  }
  if (cashier1 && cashier2) {
    sql = sql + ` and ts.Cashier between '${cashier1}' and '${cashier2}' `
  }
  if (groupCode1 && groupCode2) {
    sql += ` and ts.R_Group between '${groupCode1}' and '${groupCode2}' `
  }
  if (pluCode) {
    sql += ` and ts.R_PluCode = '${pluCode}' `
  }
  sql += ` group by ts.R_Group, ts.R_PluCode, ts.R_PName`
  const results = await pool.query(sql)
  const sumQty = results.reduce((partialSum, a) => partialSum + a.R_Quan, 0)
  const sumNetTotal = results.reduce(
    (partialSum, a) => partialSum + a.R_Total,
    0
  )
  return {
    data: results,
    summary: {
      qty: sumQty,
      netTotal: sumNetTotal
    }
  }
}

const getTimeData = (fixTime, results) => {
  const newResults = []
  fixTime.forEach((item) => {
    const newFindTime =
      results.filter((t) => t.B_Ontime.substr(0, 2) === item) || []
    newResults.push({
      time: item + ":00",
      countBill: newFindTime.length,
      countCust: newFindTime.reduce(
        (partialSum, a) => partialSum + a.B_Cust,
        0
      ),
      sumNetTotal: newFindTime.reduce(
        (partialSum, a) => partialSum + a.B_NetTotal,
        0
      )
    })
  })
  return newResults
}

const getCustomerPerHour = async (macno1, macno2) => {
  let sql = `select B_Ontime, B_Cust, B_NetTotal 
        from billno b 
        where b.B_OnDate ='${getMoment().format("YYYY-MM-DD")}' 
        and b.B_Void <> 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and b.B_MacNo between '${macno1}' and '${macno2}' `
  }
  const results = await pool.query(sql)
  const fixTime = [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23"
  ]
  const newResults = getTimeData(fixTime, results)
  return {
    data: newResults,
    summary: {
      countBill: newResults.reduce(
        (partialSum, a) => partialSum + a.countBill,
        0
      ),
      countCust: newResults.reduce(
        (partialSum, a) => partialSum + a.countCust,
        0
      ),
      sumNetTotal: newResults.reduce(
        (partialSum, a) => partialSum + a.sumNetTotal,
        0
      )
    }
  }
}

const getTimeCurrentData = (fixTime, results) => {
  const newResults = []
  fixTime.forEach((item) => {
    const newFindTime = results.filter((t) => t.R_Time.substr(0, 2) === item)
    if (newFindTime.length === 0) {
      return
    }
    newResults.push({ time: item + ":00" }, newFindTime)
  })
  return newResults
}

const getHourlyReport = async (macno1, macno2) => {
  let sql = `select R_Time, R_PluCode, R_PName, R_Quan, R_Total 
        from t_sale ts 
        where ts.R_Date = '${getMoment().format("YYYY-MM-DD")}' 
        and ts.R_Void <> 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and ts.MacNo between '${macno1}' and '${macno2}' `
  }
  const results = await pool.query(sql)
  const fixTime = [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23"
  ]
  const newResults = getTimeCurrentData(fixTime, results)
  return newResults
}

const getReceipt = async (macno1, macno2) => {
  let sql = `select B_Refno, B_Ontime, 
        B_Cash, B_Ton, B_CrCode1, B_CrAmt1, B_NetTotal, B_Vat 
        from billno b 
        where b.B_OnDate ='${getMoment().format("YYYY-MM-DD")}' 
        and b.B_Void <> 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and b.B_MacNo between '${macno1}' and '${macno2}' `
  }
  const results = await pool.query(sql)
  const newResults = []
  results.map((item) => {
    newResults.push(item)
    if (item.B_Cash > 0) {
      newResults.push({
        paymentType: "Cash",
        paymentTime: "",
        paymentAmount: item.B_Cash - item.B_Ton,
        paymentVat: ""
      })
    }
    if (item.B_CrCode1 !== "") {
      newResults.push({
        paymentType: item.B_CrCode1,
        paymentTime: "",
        paymentAmount: item.B_CrAmt1,
        paymentVat: ""
      })
    }
  })
  return newResults
}

const getVoidBill = async (macno1, macno2, cashier1, cashier2) => {
  let sql = `select B_MacNo, B_Cashier, B_Table, B_Ontime, B_VoidUser, B_VoidTime, 
        B_Refno, ts.R_PluCode, ts.R_Quan, ts.R_Total 
        from billno b inner join t_sale ts on b.B_Refno =ts.R_Refno 
        where b.B_OnDate ='${getMoment().format(
          "YYYY-MM-DD"
        )}' and b.B_Void = 'V' `
  if (macno1 && macno2) {
    sql = sql + ` and b.B_MacNo between '${macno1}' and '${macno2}' `
  }
  if (cashier1 && cashier2) {
    sql = sql + ` and b.B_Cashier between '${cashier1}' and '${cashier2}' `
  }
  const results = await pool.query(sql)
  return {
    data: results,
    summary: {
      voidCount: results.length,
      voidAmount: results.reduce((partialSum, a) => partialSum + a.R_Total, 0)
    }
  }
}

const getCreditPayment = async (macno1, macno2, cashier1, cashier2) => {
  let sql = `select c.CrCode, c.CrName, 
            b.B_CardNo1, b.B_AppCode1, b.B_CrChargeAmt1, b.B_CrAmt1 
            from billno b left join creditfile c on b.B_CrCode1 =c.CrCode 
            where b.B_OnDate ='${getMoment().format("YYYY-MM-DD")}' 
            and b.B_Void <> 'V' 
            and (B_CrCode1 <> '' or B_CrCode1 <> null) `
  let sql2 = `select c.CrCode, count(c.CrCode), 
        sum(b.B_CrChargeAmt1) B_CrChargeAmt1, sum(b.B_CrAmt1) B_CrAmt1 
        from billno b  left join creditfile c on b.B_CrCode1 =c.CrCode 
        where b.B_OnDate ='${getMoment().format(
          "YYYY-MM-DD"
        )}' and b.B_Void <> 'V' 
        and (B_CrCode1 <> '' or B_CrCode1 <> null) `

  if (macno1 && macno2) {
    sql = sql + ` and b.B_MacNo between '${macno1}' and '${macno2}' `
    sql2 = sql2 + ` and b.B_MacNo between '${macno1}' and '${macno2}' `
  }
  if (cashier1 && cashier2) {
    sql = sql + ` and b.B_Cashier between '${cashier1}' and '${cashier2}' `
    sql2 = sql2 + ` and b.B_Cashier between '${cashier1}' and '${cashier2}' `
  }

  sql2 = sql2 + " group by CrCode "

  const results = await pool.query(sql)
  const results2 = await pool.query(sql2)

  const newResults = results.map((item, index) => {
    return {
      ...item,
      index: index + 1
    }
  })
  return {
    data: newResults,
    summary: {
      creditCount: newResults.length,
      creditAmount: newResults.reduce(
        (partialSum, a) => partialSum + a.B_CrAmt1,
        0
      )
    }
  }
}

function compareNumbers(a, b) {
  return b.R_Quan - a.R_Quan
}

const getTopSale = async (
  macno1,
  macno2,
  cashier1,
  cashier2,
  group1,
  group2
) => {
  let sql = `select g.GroupCode, g.GroupName, t.R_PluCode, t.R_PName,
        sum(t.R_Quan) R_Quan , sum(t.R_Total) R_Total 
        from t_sale t 
        left join groupfile g on t.R_Group=g.GroupCode 
        where t.R_Date ='${getMoment().format("YYYY-MM-DD")}' `
  if (macno1 && macno2) {
    sql = sql + ` and t.MacNo between '${macno1}' and '${macno2}' `
  }
  if (cashier1 && cashier2) {
    sql = sql + ` and t.Cashier between '${cashier1}' and '${cashier2}' `
  }
  if (group1 && group2) {
    sql = sql + ` and g.GroupCode between '${group1}' and '${group2}' `
  }
  sql =
    sql +
    ` group by t.R_PluCode, t.R_PName , g.GroupCode, g.GroupName limit 0, 10 `
  const results = await pool.query(sql)
  const newResults = results.sort(compareNumbers).map((item, index) => {
    return {
      ...item,
      index: index + 1
    }
  })
  return newResults
}

const getPromotion = async (macno) => {
  return []
}

const getSpecialCupon = async (macno) => {
  return []
}

const getTopSaleList = async () => {
  const sql = `select sum(R_Quan) SUM_QTY, R_PluCode, R_PName 
        from t_sale where R_Date = '${getMoment().format("YYYY-MM-DD")}' 
        group by R_PluCode,R_PName 
        order by SUM_QTY desc 
        limit 0,3`
  const results = await pool.query(sql)
  const newResults = results.sort(compareNumbers).map((item, index) => {
    return {
      ...item,
      index: index + 1
    }
  })
  return newResults
}

const getSaleByType = async () => {
  const sql = `select ts.R_ETD, sum(ts.R_Total) NetTotal 
            from t_sale ts 
            where ts.R_Date ='${getMoment().format("YYYY-MM-DD")}' 
            group by ts.R_ETD`
  const results = await pool.query(sql)
  const total = results.reduce((partialSum, a) => partialSum + a.NetTotal, 0)
  const newResults = results.map((item) => {
    if (item.R_ETD === "E") {
      return {
        ...item,
        label: "Dine In",
        value: Math.round((item.NetTotal / total) * 100)
      }
    } else if (item.R_ETD === "T") {
      return {
        ...item,
        label: "Take Away",
        value: Math.round((item.NetTotal / total) * 100)
      }
    } else if (item.R_ETD === "D") {
      return {
        ...item,
        label: "Delivery",
        value: Math.round((item.NetTotal / total) * 100)
      }
    }
  })
  return newResults
}

const getSaleByGroup = async () => {
  const sql = `SELECT 
        SUM(B_Food) Food, 
        SUM(B_Drink) Drink, 
        SUM(B_Product) Product 
        FROM billno b 
        WHERE b.B_OnDate ='${getMoment().format("YYYY-MM-DD")}'`
  const results = await pool.query(sql)
  const newResults = Object.keys(results[0]).map((key) => {
    return {
      label: key,
      NetTotal: results[0][key]
    }
  })
  const total = newResults.reduce((partialSum, a) => partialSum + a.NetTotal, 0)
  const newMapping = newResults.map((item) => {
    return {
      ...item,
      value: Math.round((item.NetTotal / total) * 100)
    }
  })
  return newMapping
}

const getAllTime = async (time1, time2) => {
  const sql = `select sum(R_Quan) R_Quan from t_sale t 
                where t.R_Date='${getMoment().format("YYYY-MM-DD")}' 
                and t.R_Time BETWEEN '${time1}' and '${time2}' 
                order by R_Time 
                limit 0, 10`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return {
      time: `${time1.substr(0, 5)} - ${time2.substr(0, 5)}`,
      qty: results[0].R_Quan ? results[0].R_Quan : 0
    }
  } else {
    return {
      time: `${time1.substr(0, 5)} - ${time2.substr(0, 5)}`,
      qty: 0
    }
  }
}

const getSaleByTime = async () => {
  const result1 = await getAllTime("06:00:00", "08:00:00")
  const result2 = await getAllTime("08:00:00", "12:00:00")
  const result3 = await getAllTime("12:00:00", "16:00:00")
  const result4 = await getAllTime("16:00:00", "21:00:00")

  const resultT11 = await getAllTime("06:00:00", "06:30:00")
  const resultT12 = await getAllTime("06:30:00", "07:00:00")
  const resultT13 = await getAllTime("07:00:00", "07:30:00")
  const resultT14 = await getAllTime("07:30:00", "08:00:00")

  const resultT21 = await getAllTime("08:00:00", "09:00:00")
  const resultT22 = await getAllTime("09:00:00", "10:00:00")
  const resultT23 = await getAllTime("10:00:00", "11:00:00")
  const resultT24 = await getAllTime("11:00:00", "12:00:00")

  const resultT31 = await getAllTime("12:00:00", "13:00:00")
  const resultT32 = await getAllTime("13:00:00", "14:00:00")
  const resultT33 = await getAllTime("14:00:00", "15:00:00")
  const resultT34 = await getAllTime("15:00:00", "16:00:00")

  const resultT41 = await getAllTime("16:00:00", "17:00:00")
  const resultT42 = await getAllTime("17:00:00", "18:00:00")
  const resultT43 = await getAllTime("18:00:00", "19:00:00")
  const resultT44 = await getAllTime("19:00:00", "21:00:00")

  return {
    overview: [result1, result2, result3, result4],
    allTime: [
      { data: [resultT11.qty, resultT12.qty, resultT13.qty, resultT14.qty] },
      { data: [resultT21.qty, resultT22.qty, resultT23.qty, resultT24.qty] },
      { data: [resultT31.qty, resultT32.qty, resultT33.qty, resultT34.qty] },
      { data: [resultT41.qty, resultT42.qty, resultT43.qty, resultT44.qty] }
    ]
  }
}

module.exports = {
  getTableOnAction,
  getTableOnActionList,
  getTerminalByMacno,
  getTerminalByCashier,
  getGroupPlu,
  getPluCode,
  getCustomerPerHour,
  getHourlyReport,
  getReceipt,
  getVoidBill,
  getCreditPayment,
  getTopSale,
  getPromotion,
  getSpecialCupon,
  getTopSaleList,
  getSaleByType,
  getSaleByGroup,
  getSaleByTime
}
