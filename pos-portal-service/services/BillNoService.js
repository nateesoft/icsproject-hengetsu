const { io } = require('socket.io-client')

// เชื่อมต่อกับ Socket.IO server
const socket = io(process.env.SOCKETIO_SERVER, {
  autoConnect: true
})
const pool = require("../config/database/MySqlConnect")
const { PrefixZeroFormat, Unicode2ASCII } = require("../utils/StringUtil")
const { emptyTableBalance, getBalanceByTableNo, getBalanceByTableNoSummary } = require("./BalanceService")
const { getCashierPrinterName } = require("../services/management/TerminalService")

const {
  getTableByCode,
  updateTableAvailableStatus,
  checkTableOpen
} = require("./TableFileService")
const {
  addDataFromBalance,
  getAllTSaleByRefno,
  processAllPIngredentReturnStock,
  processAllPSet,
  getAllTSaleByRefnoSummary
} = require("./TSaleService")

const { getBranch } = require("./BranchService")
const { ProcessStockOut } = require("./STCardService")
const { getPOSConfigSetup } = require("./POSConfigSetupService")
const {
  updateRefundMember,
  updateMemberData,
  getDataByMemberCode
} = require("./member/crm/MemberMasterService")
const { getMoment, getCurrentTime } = require("../utils/MomentUtil")
const { summaryBalance } = require("./CoreService")
const { createListCredit, deleteListTempCredit } = require("./TCreditService")
const { printReceiptHtml, printReviewReceiptHtml, printRefundBillHtml, printReceiptCopyHtml } = require('./SyncPrinterService')
const { mappingResultDataList, mappingResultData } = require('../utils/ConvertThai')
const { addDataFromTemp } = require('./CuponService')
const { getTempGiftList, deleteTempGiftAll, createListGiftFromTemp } = require('./TGiftService')

const getAllBillNoToday = async () => {
  const sql = `select * from billno where B_OnDate='${getMoment().format("YYYY-MM-DD")}' order by B_Refno desc`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const searchBillNoCondition = async (billNo, postDate, macno) => {
  let sql = `select * from billno`
  if (billNo) {
    sql = sql + ` where B_Refno='${billNo}' order by B_PostDate`
  } else if (postDate) {
    sql = sql + ` where DATE_FORMAT(B_PostDate, '%Y-%m-%d')='${postDate}'`
  } else if (macno) {
    sql =
      sql +
      ` where B_MacNo='${macno}' or B_Cashier='${macno}' order by B_PostDate`
  }
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const getBillNoByTableNo = async (tableNo) => {
  const sql = `select * from billno where B_Table='${tableNo}'`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const getBillNoByRefno = async (billNo) => {
  const sql = `select * from billno where B_Refno='${billNo}'`
  const results = await pool.query(sql)
  return mappingResultData(results)
}

const getBillNoByRefnoExist = async (billNo) => {
  const sql = `select B_Refno from billno where B_Refno='${billNo}'`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

const emptyBillNoTSale = async (billNo) => {
  const sql1 = `delete from billno where B_Refno='${billNo}'`
  await pool.query(sql1)

  const sql2 = `delete from t_sale where R_Refno='${billNo}'`
  await pool.query(sql2)
}

const updateNextBill = async (macno) => {
  const sql = `UPDATE poshwsetup SET receno1=receno1+1 WHERE terminal='${macno}' `
  const results = await pool.query(sql)
  return results
}

const updateMemberPoint = async (memberCode, totalScore, billNo) => {
  const sql = `UPDATE billno 
    SET B_MemCode='${memberCode}', B_MemCurSum='${totalScore}' 
    WHERE B_Refno='${billNo}'`
  const result = await pool.query(sql)
  return result
}

const printCopyBill = async (billNo, Cashier, macno, copy) => {
  const sql = `UPDATE billno 
    SET B_MacNo='${macno}',
    B_Cashier='${Cashier}',
    B_BillCopy=B_BillCopy+${copy} WHERE B_Refno='${billNo}'`
  await pool.query(sql)

  const billInfo = await getBillNoByRefno(billNo)
  const tSaleInfo = await getAllTSaleByRefno(billNo)

  const printerInfo = await getCashierPrinterName(macno)

  // send to printer
  socket.emit(
    "printerMessage",
    JSON.stringify({
      id: 1,
      printerType: "message",
      printerName: printerInfo.receipt_printer || 'cashier',
      message: await printReceiptCopyHtml({macno, billInfo, tSaleInfo, printerInfo}),
      terminal: "",
      tableNo: "",
      billNo: "",
      title: "",
      billType: ""
    })
  )

  return billNo
}

const updateRefundBill = async (billNoData) => {
  const getVoidTime = getCurrentTime()
  const sql = `UPDATE billno SET B_Void='${billNoData.B_Void}', 
    B_VoidTime='${getVoidTime}', 
    B_VoidUser='${billNoData.B_VoidUser}' 
    WHERE B_Refno='${billNoData.B_Refno}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundTsale = async (billNo) => {
  const sql = `UPDATE t_sale SET R_Refund='V' WHERE R_Refno='${billNo}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundTSaleSet = async (billNo) => {
  const sql = `UPDATE t_saleset SET R_Refund='V' WHERE R_Refno='${billNo}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundTCupon = async (billNo) => {
  const sql = `update t_cupon set refund='V' where r_refno='${billNo}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundTPromotion = async (billNo) => {
  const sql = `delete from t_promotion where r_refno='${billNo}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundTGift = async (billNo) => {
  const sql = `update t_gift set fat='V' where refno='${billNo}'`
  const results = await pool.query(sql)
  return results
}

const updateRefundAccr = async (billNo, macno, branchCode) => {
  const sql = `delete from accr where (arno='${branchCode}/${macno}/${billNo}')`
  const results = await pool.query(sql)
  return results
}

const updateRefundMTran = async (billNo, macno) => {
  const sql = "delete from mtran where m_billno='" + macno + "/" + billNo + "'"
  const results = await pool.query(sql)
  return results
}

const updateRefundMTranPlu = async (billNo, macno) => {
  const sql = "delete from mtranplu where m_billno='" + macno + "/" + billNo + "'"
  const results = await pool.query(sql)
  return results
}

const getBillIDCurrent = async (macno) => {
  const sql = `select ReceNo1 from poshwsetup where Terminal='${macno}' limit 1`
  const results = await pool.query(sql)

  let NextBillId = null
  if (results.length > 0) {
    const ReceNo1 = parseInt(results[0].ReceNo1)
    NextBillId = PrefixZeroFormat(ReceNo1, 7)
  }

  return NextBillId
}

const addNewBill = async (payload) => {
  const posConfigSetup = await getPOSConfigSetup()
  const {
    macno,
    empCode,
    tableNo,
    billType,
    tonAmount,
    netTotal,
    memberInfo,
    cashInfo,
    creditInfo,
    giftVoucherAmt,
    transferInfo,
    discountInfo,
    serviceInfo,
    branchInfo,
    B_Entertain,
    B_UserEntertain,
    B_Earnest,
    creditList,
    specialCuponInfo
  } = payload
  const { Code: branchCode } = branchInfo
  const tableFile = await getTableByCode(tableNo)
  const { serviceAmount, vatAmount } = serviceInfo
  const { Cashier, TCustomer, Food, Drink, Product } = tableFile

  const { cashAmount } = cashInfo
  const {
    crCode,
    creditNumber,
    creditRef,
    creditChargePercent,
    creditChargeAmount,
    creditAmount
  } = creditInfo
  const { transferAmount } = transferInfo
  const {} = discountInfo

  // summary before create billno
  const curdate = getMoment().format("YYYY-MM-DD")
  const curtime = getMoment().format("HH:mm:ss")

  let B_Refno = await getBillIDCurrent(macno)

  // *** if exist B_Refno , empty billno, t_sale ***
  const BillNoData = await getBillNoByRefnoExist(B_Refno)
  if (BillNoData) {
    await emptyBillNoTSale(B_Refno)
  }

  // list all balance
  const allBalance = await getBalanceByTableNo(tableNo)

  const B_CuponDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrCuType === '-C') ? sum + item.R_PrCuAmt: sum
  }, 0)
  const B_Ontime = curtime
  const B_LoginTime = curtime
  const B_OnDate = curdate
  const B_PostDate = curdate
  const B_Table = tableNo
  const B_MacNo = macno
  const B_Cashier = Cashier
  const B_Cust = TCustomer
  const B_ETD = billType
  const B_Food = Food
  const B_Drink = Drink
  const B_Product = Product
  const B_Total = B_Food + B_Drink + B_Product

  const B_Service = posConfigSetup.P_Service
  const B_ServiceAmt = serviceAmount
  const B_ItemDiscAmt = 0
  const B_FastDisc = posConfigSetup.P_FastDisc || ""
  const B_FastDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrSubType === '-F') ? sum + item.R_PrSubAmt: sum
  }, 0)
  const B_EmpDisc = posConfigSetup.P_EmpDisc || ""
  const B_EmpDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrSubType === '-E') ? sum + item.R_PrSubAmt: sum
  }, 0)
  const B_TrainDisc = posConfigSetup.P_TrainDisc || ""
  const B_TrainDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrSubType === '-T') ? sum + item.R_PrSubAmt: sum
  }, 0)
  const B_MemDisc = posConfigSetup.P_MemDisc || ""
  const B_MemDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrSubType === '-M') ? sum + item.R_PrSubAmt: sum
  }, 0)
  const B_SubDisc = posConfigSetup.P_SubDisc || ""
  const B_SubDiscAmt = allBalance.reduce((sum, item) => {
    return (item.R_PrSubType === '-S') ? sum + item.R_PrSubAmt: sum
  }, 0)
  const B_SubDiscBath = allBalance.reduce((sum, item) => {
    return (item.R_DiscBath > 0) ? sum + item.R_DiscBath: sum
  }, 0)
  const B_ProDiscAmt = 0
  const B_SpaDiscAmt = 0
  const B_AdjAmt = 0
  const B_PreDisAmt = 0
  const B_NetTotal = netTotal
  const B_NetFood = Food
  const B_NetDrink = Drink
  const B_NetProduct = Product
  const B_NetVat = netTotal - creditChargeAmount
  const B_NetNonVat = 0
  const B_Vat = vatAmount
  const B_PayAmt = parseFloat(cashAmount) + transferAmount
  const B_Cash = parseFloat(cashAmount) + transferAmount
  const B_GiftVoucher = giftVoucherAmt
  // const B_Earnest = 0;
  const B_Ton = tonAmount
  const B_CrCode1 = crCode
  const B_CardNo1 = creditNumber
  const B_AppCode1 = creditRef
  const B_CrCharge1 = creditChargePercent
  const B_CrChargeAmt1 = creditChargeAmount
  const B_CrAmt1 = creditAmount
  const B_AccrCode = ""
  const B_AccrAmt = 0
  const B_AccrCr = 0
  const B_MemCode = memberInfo.Member_Code ? memberInfo.Member_Code : ""
  const B_MemName = memberInfo.Member_NameThai
    ? Unicode2ASCII(memberInfo.Member_NameThai)
    : ""
  const B_MemBegin = memberInfo.Member_AppliedDate
    ? getMoment(memberInfo.Member_AppliedDate).format("YYYY-MM-DD")
    : getMoment().format("YYYY-MM-DD")
  const B_MemEnd = memberInfo.Member_ExpiredDate
    ? getMoment(memberInfo.Member_ExpiredDate).format("YYYY-MM-DD")
    : getMoment().format("YYYY-MM-DD")
  const B_MemCurSum = 0
  const B_Void = "-"
  const B_VoidUser = ""
  const B_VoidTime = ""
  const B_BillCopy = 0
  const B_PrnCnt = 0
  const B_PrnTime1 = ""
  const B_PrnTime2 = ""
  const B_InvNo = ""
  const B_InvType = ""
  const B_Bran = ""
  const B_BranName = ""
  const B_Tel = ""
  const B_RecTime = ""
  const MStamp = ""
  const MScore = ""
  const CurStamp = ""
  const StampRate = ""
  const B_ChkBill = ""
  const B_ChkBillTime = curtime
  const B_CashTime = curtime
  const B_WaitTime = "00:00:00"
  const B_SumScore = 0
  const B_CrBank = ""
  const B_CrCardAmt = creditAmount
  const B_CrCurPoint = 0
  const B_CrSumPoint = 0
  // const B_Entertain = 0;
  const B_VoucherDiscAmt = 0
  const B_VoucherOver = 0
  const B_NetDiff = 0
  const B_SumSetDiscAmt = 0
  const B_DetailFood = 0
  const B_DetailDrink = 0
  const B_DetailProduct = 0
  const B_KicQue = ""
  const B_ROUNDCLOSE = "N"
  const R_Opt9 = ""
  const R_Opt1 = ""
  const R_Opt2 = ""
  const R_Opt3 = ""
  const R_Opt4 = ""
  const R_Opt5 = ""
  const R_Opt6 = ""
  const R_Opt7 = ""
  const R_Opt8 = ""
  const VoidMsg = ""
  const B_EarnDocNo = ""
  const B_UseEarnNo = ""
  // const B_UserEntertain = "";
  const B_SendOnline = ""

  const sql = `INSERT INTO billno 
        (B_Refno,B_CuponDiscAmt,B_Ontime,B_LoginTime,B_OnDate,B_PostDate,B_Table,B_MacNo,B_Cashier,B_Cust,B_ETD,
        B_Total,B_Food,B_Drink,B_Product,B_Service,B_ServiceAmt,B_ItemDiscAmt,B_FastDisc,B_FastDiscAmt,B_EmpDisc,
        B_EmpDiscAmt,B_TrainDisc,B_TrainDiscAmt,B_MemDisc,B_MemDiscAmt,B_SubDisc,B_SubDiscAmt,B_SubDiscBath,
        B_ProDiscAmt,B_SpaDiscAmt,B_AdjAmt,B_PreDisAmt,B_NetTotal,B_NetFood,B_NetDrink,B_NetProduct,B_NetVat,
        B_NetNonVat,B_Vat,B_PayAmt,B_Cash,B_GiftVoucher,B_Earnest,B_Ton,B_CrCode1,B_CardNo1,B_AppCode1,
        B_CrCharge1,B_CrChargeAmt1,B_CrAmt1,B_AccrCode,B_AccrAmt,B_AccrCr,B_MemCode,B_MemName,B_MemBegin,
        B_MemEnd,B_MemCurSum,B_Void,B_VoidUser,B_VoidTime,B_BillCopy,B_PrnCnt,B_PrnTime1,B_PrnTime2,B_InvNo,
        B_InvType,B_Bran,B_BranName,B_Tel,B_RecTime,MStamp,MScore,CurStamp,StampRate,B_ChkBill,B_ChkBillTime,
        B_CashTime,B_WaitTime,B_SumScore,B_CrBank,B_CrCardAmt,B_CrCurPoint,B_CrSumPoint,B_Entertain,
        B_VoucherDiscAmt,B_VoucherOver,B_NetDiff,B_SumSetDiscAmt,B_DetailFood,B_DetailDrink,B_DetailProduct,
        B_KicQue,B_ROUNDCLOSE,R_Opt9,R_Opt1,R_Opt2,R_Opt3,R_Opt4,R_Opt5,R_Opt6,R_Opt7,R_Opt8,VoidMsg,
        B_EarnDocNo,B_UseEarnNo,B_UserEntertain,B_SendOnline) 
        VALUES ('${B_Refno}','${B_CuponDiscAmt}','${B_Ontime}','${B_LoginTime}','${B_OnDate}','${B_PostDate}','${B_Table}',
        '${B_MacNo}','${B_Cashier}','${B_Cust}','${B_ETD}','${B_Total}','${B_Food}','${B_Drink}','${B_Product}',
        '${B_Service}','${B_ServiceAmt}','${B_ItemDiscAmt}','${B_FastDisc}','${B_FastDiscAmt}','${B_EmpDisc}',
        '${B_EmpDiscAmt}','${B_TrainDisc}','${B_TrainDiscAmt}','${B_MemDisc}','${B_MemDiscAmt}','${B_SubDisc}',
        '${B_SubDiscAmt}','${B_SubDiscBath}','${B_ProDiscAmt}','${B_SpaDiscAmt}','${B_AdjAmt}','${B_PreDisAmt}',
        '${B_NetTotal}','${B_NetFood}','${B_NetDrink}','${B_NetProduct}','${B_NetVat}','${B_NetNonVat}','${B_Vat}',
        '${B_PayAmt}','${B_Cash}','${B_GiftVoucher}','${B_Earnest}','${B_Ton}','${B_CrCode1}','${B_CardNo1}',
        '${B_AppCode1}','${B_CrCharge1}','${B_CrChargeAmt1}','${B_CrAmt1}','${B_AccrCode}','${B_AccrAmt}','${B_AccrCr}',
        '${B_MemCode}','${B_MemName}','${B_MemBegin}','${B_MemEnd}','${B_MemCurSum}','${B_Void}','${B_VoidUser}',
        '${B_VoidTime}','${B_BillCopy}','${B_PrnCnt}','${B_PrnTime1}','${B_PrnTime2}','${B_InvNo}','${B_InvType}',
        '${B_Bran}','${B_BranName}','${B_Tel}','${B_RecTime}','${MStamp}','${MScore}','${CurStamp}','${StampRate}',
        '${B_ChkBill}','${B_ChkBillTime}','${B_CashTime}','${B_WaitTime}','${B_SumScore}','${B_CrBank}','${B_CrCardAmt}',
        '${B_CrCurPoint}','${B_CrSumPoint}','${B_Entertain}','${B_VoucherDiscAmt}','${B_VoucherOver}','${B_NetDiff}',
        '${B_SumSetDiscAmt}','${B_DetailFood}','${B_DetailDrink}','${B_DetailProduct}','${B_KicQue}','${B_ROUNDCLOSE}',
        '${R_Opt9}','${R_Opt1}','${R_Opt2}','${R_Opt3}','${R_Opt4}','${R_Opt5}','${R_Opt6}','${R_Opt7}','${R_Opt8}',
        '${VoidMsg}','${B_EarnDocNo}','${B_UseEarnNo}','${B_UserEntertain}','${B_SendOnline}')`
  const results = await pool.query(sql)
  if (results) {
    
    // save t_sale list
    await addDataFromBalance(B_Table, B_Refno, allBalance)

    // move cupon temp
    if(B_CuponDiscAmt>0){
      await addDataFromTemp(B_Refno, B_Table)
    }

    if (creditAmount > 0) {
      // update credit file
      await createListCredit(creditList, B_Refno, B_Cashier)
      await deleteListTempCredit(creditList, tableNo)
    }

    if (giftVoucherAmt > 0) {
      // update tempgift
      const resultTempGift = await getTempGiftList(tableNo)
      await createListGiftFromTemp(resultTempGift, B_Refno)
      await deleteTempGiftAll(macno, B_Table)
    }

    if (Object.keys(memberInfo).length > 0) {
      // update member memmaster
      await updateMemberData(
        B_NetTotal,
        B_MemCode,
        B_MacNo,
        B_Refno,
        allBalance,
        branchCode,
        B_ETD,
        B_Total,
        B_ServiceAmt,
        B_MemDiscAmt,
        B_Cashier,
        B_OnDate,
        B_Ontime,
        memberInfo
      )
    }

    // get current member score
    const memberCurrent = await getDataByMemberCode(memberInfo.Member_Code)
    if(memberCurrent){
      await updateMemberPoint(memberInfo.Member_Code, memberCurrent.Member_TotalScore, B_Refno)
    }

    // update next bill id
    await updateNextBill(macno)

    // clear balance
    await emptyTableBalance(B_Table)

    // update tablefile
    await updateTableAvailableStatus(B_Table)

    const billInfo = await getBillNoByRefno(B_Refno)
    const tSaleInfo = await getAllTSaleByRefnoSummary(B_Refno)

    const printerInfo = await getCashierPrinterName(B_MacNo)

    // send to printer
    socket.emit(
      "printerMessage",
      JSON.stringify({
        id: 1,
        printerType: "receipt",
        printerName: printerInfo.receipt_printer || 'cashier',
        message: await printReceiptHtml({macno: B_MacNo, billInfo, tSaleInfo, printerInfo}),
        terminal: "",
        tableNo: "",
        billNo: "",
        title: "",
        billType: ""
      })
    )
    
    // delete tablefile if found xxx-xx
    if (B_Table.split("-").length > 1) {
      await pool.query(`delete from tablefile where Tcode='${B_Table}'`)
    }

    return B_Refno
  }
  return null
}

const refundTSale = async (tSaleData, Cashier) => {
  tSaleData.forEach(async (tSale) => {
    if (tSale.R_Void !== "V" && tSale.R_Stock === "Y") {
      const S_No = "R" + tSale.R_Refno
      const S_SubNo = ""
      const S_Que = 0
      const S_PCode = tSale.R_PluCode
      const S_In = tSale.R_Quan
      const S_Out = 0
      const S_InCost = tSale.R_Total
      const S_OutCost = 0
      const S_ACost = 0
      const S_Rem = "SAL"
      const S_User = Cashier
      const S_Link = ""

      const PStock = tSale.R_Stock
      const PSet = tSale.R_Set
      const r_index = tSale.R_Index
      const SaleOrRefund = "REFUND" // SALE or REFUND

      await ProcessStockOut(
        S_No,
        S_SubNo,
        S_Que,
        S_PCode,
        S_In,
        S_Out,
        S_InCost,
        S_OutCost,
        S_ACost,
        S_Rem,
        S_User,
        S_Link,
        PStock,
        PSet,
        r_index,
        SaleOrRefund
      )

      // ตัดสต็อกสินค้าที่มี Ingredent
      await processAllPIngredentReturnStock(
        S_No,
        tSale.R_PluCode,
        tSale.R_Quan,
        tSale.Cashier
      )

      // ตัดสต็อกสินค้าที่เป็นชุด SET (PSET)
      await processAllPSet(tSale.R_PluCode, tSale.R_Quan, tSale.Cashier)
    }
  })
}

const billRefundStockIn = async (billNo, Cashier, macno) => {
  const branchData = await getBranch()
  const billNoData = await getBillNoByRefno(billNo)
  const tSaleData = await getAllTSaleByRefno(billNo)

  // update table t_sale void
  await updateRefundTsale(billNo)
  await updateRefundTSaleSet(billNo)
  await updateRefundTCupon(billNo)
  await updateRefundTPromotion(billNo)
  await updateRefundTGift(billNo)
  await updateRefundAccr(billNo, macno, branchData.Code)

  if (!billNoData.B_MemCode) {
    await updateRefundMember(billNoData)

    // empty member on POS
    await updateRefundMTran(billNo, macno)
    await updateRefundMTranPlu(billNo, macno)
  }

  // update billno
  billNoData.B_Void = "V"
  billNoData.B_VoidUser = Cashier
  await updateRefundBill(billNoData)

  // update refund tSale List
  await refundTSale(tSaleData, Cashier)

  const billInfo = await getBillNoByRefno(billNo)
  const tSaleInfo = await getAllTSaleByRefnoSummary(billNo)

  const printerInfo = await getCashierPrinterName(macno)

  // send to printer
  socket.emit(
    "printerMessage",
    JSON.stringify({
      id: 1,
      printerType: "message",
      printerName: printerInfo.receipt_printer || 'cashier',
      message: await printRefundBillHtml({macno, billInfo, tSaleInfo, printerInfo}),
      terminal: "",
      tableNo: "",
      billNo: "",
      title: "",
      billType: ""
    })
  )

  return billNo
}

const createNewBalanceFromTSale = async (tSale, tableNo) => {
  const newRDate = getMoment().format("YYYY-MM-DD")
  const newRTime = getMoment().format("HH:mm:ss")
  const {
    R_Index,
    R_Refno,
    R_Table,
    MacNo,
    Cashier,
    R_Emp,
    R_PluCode,
    R_PName,
    R_Unit,
    R_Group,
    R_Status,
    R_Normal,
    R_Discount,
    R_Service,
    R_Stock,
    R_Set,
    R_Vat,
    R_Type,
    R_ETD,
    R_Quan,
    R_Price,
    R_Total,
    R_PrType,
    R_PrCode,
    R_PrDisc,
    R_PrBath,
    R_PrAmt,
    R_PrCuType,
    R_PrCuCode,
    R_PrCuQuan,
    R_PrCuAmt,
    R_Redule,
    R_DiscBath,
    R_Kic,
    R_KicPrint,
    VoidMsg,
    R_Void,
    R_VoidUser,
    R_VoidTime,
    StkCode,
    PosStk,
    R_ServiceAmt,
    R_PrChkType,
    R_PrQuan,
    R_PrSubType,
    R_PrSubCode,
    R_PrSubQuan,
    R_PrSubDisc,
    R_PrSubBath,
    R_PrSubAmt,
    R_PrSubAdj,
    R_PrCuDisc,
    R_PrCuBath,
    R_PrCuAdj,
    R_PItemNo,
    R_PKicQue,
    R_PrVcType="",
    R_PrVcCode,
    R_PrVcAmt,
    R_PrVcAdj,
    R_MoveFlag,
    R_Pause,
    R_SPIndex,
    R_LinkIndex,
    R_VoidPause,
    R_MoveItem,
    R_MoveFrom,
    R_MoveUser,
    R_Opt9,
    R_Opt1,
    R_Opt2,
    R_Opt3,
    R_Opt4,
    R_Opt5,
    R_Opt6,
    R_Opt7,
    R_Opt8,
    R_PrintItemBill,
    R_CountTime,
    R_Earn,
    R_EarnNo  } = tSale
  const newBalance = { ...tSale }
  newBalance.R_Index = R_Index.replaceAll(R_Table, tableNo).replaceAll(R_Refno+"/", "")
  newBalance.R_Table = tableNo
  newBalance.FieldName = 0
  newBalance.R_Serve = ""
  newBalance.R_PrintOK = ""
  newBalance.R_KicOK = ""
  newBalance.R_QuanCanDisc = 0
  newBalance.R_Order = ""
  newBalance.R_MemSum = ""
  newBalance.R_VoidQuan = 0
  newBalance.R_MovePrint = ""
  newBalance.SoneCode = ""
  newBalance.PDAPrintCheck = ""
  newBalance.PDAEMP = ""
  newBalance.R_empName = ""
  newBalance.R_PEName = ""
  newBalance.R_Indulgent = ""
  newBalance.TranType = ""
  newBalance.VoidMsg = Unicode2ASCII(VoidMsg)

  // convert to ascii
  const RPName = Unicode2ASCII(R_PName)
  const ROpt1 = Unicode2ASCII(R_Opt1)
  const ROpt2 = Unicode2ASCII(R_Opt2)
  const ROpt3 = Unicode2ASCII(R_Opt3)
  const ROpt4 = Unicode2ASCII(R_Opt4)
  const ROpt5 = Unicode2ASCII(R_Opt5)
  const ROpt6 = Unicode2ASCII(R_Opt6)
  const ROpt7 = Unicode2ASCII(R_Opt7)
  const ROpt8 = Unicode2ASCII(R_Opt8)
  const ROpt9 = Unicode2ASCII(R_Opt9)

  const sql = `INSERT INTO balance 
    (R_Index,R_Table,R_Date,R_Time,Macno,Cashier,R_Emp,R_PluCode,R_PName,R_Unit,R_Group,R_Status,R_Normal,
    R_Discount,R_Service,R_Stock,R_Set,R_Vat,R_Type,R_ETD,R_Quan,R_Price,R_Total,R_PrType,R_PrCode,R_PrDisc,
    R_PrBath,R_PrAmt,R_DiscBath,R_PrCuType,R_PrCuQuan,R_PrCuAmt,R_Redule,R_Kic,R_KicPrint,R_Void,R_VoidUser,
    R_VoidTime,FieldName,R_Opt1,R_Opt2,R_Opt3,R_Opt4,R_Opt5,R_Opt6,R_Opt7,R_Opt8,R_Opt9,R_PrCuCode,R_Serve,
    R_PrintOK,R_KicOK,StkCode,PosStk,R_PrChkType,R_PrQuan,R_PrSubType,R_PrSubCode,R_PrSubQuan,R_PrSubDisc,
    R_PrSubBath,R_PrSubAmt,R_PrSubAdj,R_PrCuDisc,R_PrCuBath,R_PrCuAdj,R_QuanCanDisc,R_Order,R_PItemNo,R_PKicQue,
    R_MemSum,R_PrVcType,R_PrVcCode,R_PrVcAmt,R_PrVcAdj,R_VoidQuan,R_MoveFlag,R_MovePrint,R_Pause,R_SPIndex,
    R_LinkIndex,R_VoidPause,R_MoveItem,R_MoveFrom,R_MoveUser,VoidMsg,R_PrintItemBill,R_CountTime,SoneCode,
    R_Earn,R_EarnNo,TranType,PDAPrintCheck,PDAEMP,R_empName,R_ServiceAmt,R_PEName,R_Indulgent) 
    VALUES ('${newBalance.R_Index}','${newBalance.R_Table}','${newRDate}','${newRTime}','${MacNo}','${Cashier}','${R_Emp}','${R_PluCode}','${RPName}',
    '${R_Unit}','${R_Group}','${R_Status}','${R_Normal}','${R_Discount}','${R_Service}','${R_Stock}','${R_Set}','${R_Vat}',
    '${R_Type}','${R_ETD}','${R_Quan}','${R_Price}','${R_Total}','${R_PrType}','${R_PrCode}','${R_PrDisc}','${R_PrBath}',
    '${R_PrAmt}','${R_DiscBath}','${R_PrCuType}','${R_PrCuQuan}','${R_PrCuAmt}','${R_Redule}','${R_Kic}','${R_KicPrint}',
    '${R_Void}','${R_VoidUser}','${R_VoidTime}','${newBalance.FieldName}','${ROpt1}','${ROpt2}','${ROpt3}','${ROpt4}','${ROpt5}',
    '${ROpt6}','${ROpt7}','${ROpt8}','${ROpt9}','${R_PrCuCode}','${newBalance.R_Serve}','${newBalance.R_PrintOK}','${newBalance.R_KicOK}','${StkCode}',
    '${PosStk}','${R_PrChkType}','${R_PrQuan}','${R_PrSubType}','${R_PrSubCode}','${R_PrSubQuan}','${R_PrSubDisc}','${R_PrSubBath}',
    '${R_PrSubAmt}','${R_PrSubAdj}','${R_PrCuDisc}','${R_PrCuBath}','${R_PrCuAdj}','${newBalance.R_QuanCanDisc}','${newBalance.R_Order}','${R_PItemNo}',
    '${R_PKicQue}','${newBalance.R_MemSum}','${R_PrVcType}','${R_PrVcCode}','${R_PrVcAmt}','${R_PrVcAdj}','${newBalance.R_VoidQuan}','${R_MoveFlag}',
    '${newBalance.R_MovePrint}','${R_Pause}','${R_SPIndex}','${R_LinkIndex}','${R_VoidPause}','${R_MoveItem}','${R_MoveFrom}','${R_MoveUser}',
    '${newBalance.VoidMsg}','${R_PrintItemBill}','${R_CountTime}','${newBalance.SoneCode}','${R_Earn}','${R_EarnNo}','${newBalance.TranType}',
    '${newBalance.PDAPrintCheck}','${newBalance.PDAEMP}','${newBalance.R_empName}','${R_ServiceAmt}','${newBalance.R_PEName}','${newBalance.R_Indulgent}')`
  const result = await pool.query(sql)
  return result
}

const loadBillnoToBalance = async (billRefNo, tableNo) => {
  const billno = await getBillNoByRefno(billRefNo)
  const tSaleList = await getAllTSaleByRefno(billRefNo)

  const tableValid = (await checkTableOpen(tableNo)) === null
  if (tableValid) {
    tSaleList.forEach(async (tSale) => {
      await createNewBalanceFromTSale(tSale, tableNo)
    })
    await summaryBalance(tableNo, billno.B_MacNo)
  } else {
    // table not available
  }

  return {
    billRefNo: billno.B_Refno
  }
}

const updateStatusPrintChkBill = async (tableNo, macno, depositAmt) => {
  // check gift amount
  const giftTempList = await getTempGiftList(tableNo)
  const giftVoucherAmt = giftTempList.reduce((n, { giftamt }) => n + parseFloat(giftamt),0)

  const sql = `update tablefile 
    set PrintChkBill='Y', DepositAmt='${depositAmt}', GiftVoucher_Amt='${giftVoucherAmt}' 
    where Tcode='${tableNo}'`
  const results = await pool.query(sql)

  await summaryBalance(tableNo, macno)
  
  let tableInfo = await getTableByCode(tableNo)
  const balanceInfo = await getBalanceByTableNoSummary(tableNo)

  const printerInfo = await getCashierPrinterName(macno)

  tableInfo = await getTableByCode(tableNo)

  // send to printer
  socket.emit(
    "printerMessage",
    JSON.stringify({
      id: 1,
      printerType: "message",
      printerName: printerInfo.receipt_printer || 'cashier',
      message: await printReviewReceiptHtml({ macno, tableInfo, balanceInfo, printerInfo }),
      terminal: "",
      tableNo: "",
      billNo: "",
      title: "",
      billType: ""
    })
  )

  return results
}

module.exports = {
  getBillNoByTableNo,
  addNewBill,
  updateNextBill,
  getBillIDCurrent,
  getBillNoByRefno,
  getAllBillNoToday,
  searchBillNoCondition,
  billRefundStockIn,
  printCopyBill,
  loadBillnoToBalance,
  updateStatusPrintChkBill
}
