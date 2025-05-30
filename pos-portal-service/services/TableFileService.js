const pool = require("../config/database/MySqlConnect")
const { getMoment, getCurrentTime } = require("../utils/MomentUtil")
const { updateInActiveTable } = require("../services/management/TableCheckIn")
const {
  getBalanceMaxIndex,
  updateBalanceMove,
  updateBalanceSplitBill,
  summaryBalance,
  getPOSConfigSetup
} = require("./CoreService")
const { Unicode2ASCII } = require("../utils/StringUtil")
const { mappingResultDataList, mappingResultData } = require("../utils/ConvertThai")
const { getTempCuponInfo } = require("./CuponService")

const MENU_FOOD = 1
const MENU_DRINK = 2
const MENU_PRODUCT = 3

const getSummaryItemNoCheckQuanCanDisc = async (tableNo) => {
  const sql = `select sum(R_Total) R_Total from balance 
  where R_Table='${tableNo}' and R_Void <> 'V' and R_LinkIndex='' `
  const results = await pool.query(sql)
  if (results.length > 0) {
    return results[0].R_Total || 0
  }
  return 0
}

const getAllTable = async () => {
  const sql = `select * FROM tablefile ORDER By Tcode`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const getCheckTableStatus = async () => {
  const sql = `SELECT * FROM tablefile 
    where TOnAct='Y' or TAmount > 0 or TItem > 0 or TCustomer > 0 
    order by Tcode`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const updateTableAvailableStatus = async (tableNo) => {
  const sql = `update tablefile 
      set TOnact='N', 
      TTableIsOn='N',
      TItem=0,TAmount=0,TCustomer=0, Cashier=null,
      Service=0,ServiceAmt=0,
      EmpDisc='',EmpDiscAmt=0,
      FastDisc='',FastDiscAmt=0,
      TrainDisc='',TrainDiscAmt=0,
      MemDisc='',MemDiscAmt=0,
      SubDisc='',SubDiscAmt=0,
      DiscBath=0,ProDiscAmt=0,SpaDiscAmt=0,CuponDiscAmt=0,
      ItemDiscAmt=0,MemCode='',MemCurAmt=0,MemName='',
      Food=0,Drink=0,Product=0,NetTotal=0,PrintTotal=0,
      PrintChkBill='N', PrintCnt=0, PrintTime1='', PrintTime2='',
      ChkBill='N', StkCode1='', StkCode2='',TDesk=0,TUser='',VoidMsg='',
      TPause='Y',TTableIsOn='Y',TActive='',TAutoClose='',
      VatAmt=0,Vat=0,MemBegin=null,MemEnd=null,TCurTime='',
      DepositAmt=0,SubTotal_Amt=0,GiftVoucher_Amt=0 
      where Tcode='${tableNo}'`
  const results = await pool.query(sql)

  // update table_checkin
  await updateInActiveTable(tableNo)
  return results
}

const updateSubTotalDiscount = ({
  R_PrSubType, R_PrSubCode, R_PrSubDisc, 
  R_Table, R_Type
}) => {
  return `UPDATE balance set 
    R_PrSubType='${R_PrSubType}', R_PrSubCode='${R_PrSubCode}', 
    R_PrSubQuan=R_QuanCanDisc, R_PrSubDisc='${R_PrSubDisc}', 
    R_PrSubAmt=R_Total*${R_PrSubDisc}/100, R_QuanCanDisc='0' 
    WHERE R_Table='${R_Table}' and R_QuanCanDisc>0 
    and R_LinkIndex = '' and R_Void <> 'V' 
    and R_Type='${R_Type}' and R_Discount='Y'`
}

const computeUpdateSubTotal = async ({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo }) => {
  // FOOD
  const discFood = FORMAT_DISC.split('/')[0]
  if(parseInt(discFood)>0){
    await pool.query(updateSubTotalDiscount({
      R_PrSubType: FIX_SUB_TYPE, R_PrSubCode: FIX_SUB_CODE, R_PrSubDisc: discFood, 
      R_Table: tableNo, R_Type: MENU_FOOD
    }))
  }
  // DRINK
  const discDrink = FORMAT_DISC.split('/')[1]
  if(parseInt(discDrink)>0){
    await pool.query(updateSubTotalDiscount({
      R_PrSubType: FIX_SUB_TYPE, R_PrSubCode: FIX_SUB_CODE, R_PrSubDisc: discDrink, 
      R_Table: tableNo, R_Type: MENU_DRINK
    }))
  }
  // PRODUCT
  const discProduct = FORMAT_DISC.split('/')[2]
  if(parseInt(discProduct)>0){
    await pool.query(updateSubTotalDiscount({
      R_PrSubType: FIX_SUB_TYPE, R_PrSubCode: FIX_SUB_CODE, R_PrSubDisc: discProduct, 
      R_Table: tableNo, R_Type: MENU_PRODUCT
    }))
  }
}

const updateCuponSubTotalDiscount = ({
  R_PrCuType, R_PrCuCode, R_PrCuDisc, R_PrCuBath,
  R_Table, R_Type
}) => {
  return `UPDATE balance 
    set R_PrCuType='${R_PrCuType}',
    R_PrCuQuan=R_QuanCanDisc, R_PrCuCode='${R_PrCuCode}',
    R_PrCuDisc='${R_PrCuDisc}', R_PrCuBath='${R_PrCuBath}',
    R_PrCuAmt=R_Total*${R_PrCuDisc}/100, R_QuanCanDisc='0' 
    WHERE R_Table='${R_Table}' 
    and R_Void <> 'V' and R_LinkIndex = '' 
    and R_Type='${R_Type}' and R_Discount='Y'`
}

const computeUpdateCuponSubTotal = async ({ cuponInfo, R_Table, FIX_SUB_TYPE }) => {
  // FOOD
  let discFood = cuponInfo.CuDisc
  if(parseInt(discFood)>0){
    await pool.query(updateCuponSubTotalDiscount({
      R_PrCuType: FIX_SUB_TYPE, R_PrCuCode: cuponInfo.CuCode, 
      R_PrCuDisc: discFood, R_PrCuBath: 0,
      R_Table: R_Table, R_Type: MENU_FOOD
    }))
  }
  
  // DRINK
  let discDrink = cuponInfo.CuDisc2
  if(parseInt(discDrink)>0){
    await pool.query(updateCuponSubTotalDiscount({
      R_PrCuType: FIX_SUB_TYPE, R_PrCuCode: cuponInfo.CuCode, 
      R_PrCuDisc: discDrink, R_PrCuBath: 0,
      R_Table: R_Table, R_Type: MENU_DRINK
    }))
  }
  
  // PRODUCT
  let discProduct = cuponInfo.CuDisc3
  if(parseInt(discProduct)>0){
    await pool.query(updateCuponSubTotalDiscount({
      R_PrCuType: FIX_SUB_TYPE, R_PrCuCode: cuponInfo.CuCode, 
      R_PrCuDisc: discProduct, R_PrCuBath: 0,
      R_Table: R_Table, R_Type: MENU_PRODUCT
    }))
  }
}

const updateTableDiscount = async (payload) => {
  const posConfigSetup = await getPOSConfigSetup()
  const {
    tableFile, 
    FastDisc=posConfigSetup.P_FastDisc, FastDiscAmt=0, 
    EmpDisc=posConfigSetup.P_EmpDisc, EmpDiscAmt=0,
    MemDisc=posConfigSetup.P_MemDisc, MemDiscAmt=0, 
    TrainDisc=posConfigSetup.P_TrainDisc, TrainDiscAmt=0, 
    SubDisc=posConfigSetup.P_SubDisc, SubDiscAmt=0,
    DiscBath=0, CuponDiscAmt=0, SpaDiscAmt=0, 
    PrCuCode = ""
  } = payload


  let fastDisc = FastDiscAmt > 0 ? FastDisc : posConfigSetup.P_FastDisc
  let empDisc = EmpDiscAmt > 0 ? EmpDisc : posConfigSetup.P_EmpDisc
  let memDisc = MemDiscAmt > 0 ? MemDisc : posConfigSetup.P_MemDisc
  let trainDisc = TrainDiscAmt > 0 ? TrainDisc : posConfigSetup.P_TrainDisc
  let subDisc = SubDiscAmt > 0 ? SubDisc : posConfigSetup.P_SubDisc

  // clear tempcupon
  if(CuponDiscAmt === 0){
    const sqlClearTempCupon = `delete from tempcupon where R_Table='${tableFile.Tcode}'`
    await pool.query(sqlClearTempCupon)
  }

  // clear discount all balance
  const sqlClearDiscounTable = `UPDATE tablefile set 
    EmpDisc='',FastDisc='',TrainDisc='',MemDisc='',SubDisc='' 
    where Tcode='${tableFile.Tcode}'`
  await pool.query(sqlClearDiscounTable)

  const sqlClearBalance = `UPDATE balance 
    SET R_QuanCanDisc=R_QuanCanDisc+R_PrSubQuan+R_PrCuQuan,
    R_PrDisc='0', R_PrBath='0', R_PrAmt='0',
    R_DiscBath='0', R_PrCuQuan='0', R_PrCuAmt='0',
    R_Redule='0', R_PrSubQuan='0',
    R_PrSubDisc='0', R_PrSubBath='0', R_PrSubAmt='0',
    R_PrSubAdj='0', R_PrCuDisc='0', R_PrCuBath='0',
    R_PrCuAdj='0', R_PrSubType='', R_PrSubCode='',R_PrCuType='' 
    WHERE R_Table='${tableFile.Tcode}' and R_LinkIndex = '' and R_Void != 'V'`
  await pool.query(sqlClearBalance)

  const totalForDiscBaht = await getSummaryItemNoCheckQuanCanDisc(tableFile.Tcode)
  const discBath = parseFloat(DiscBath)
  if (discBath > 0 && totalForDiscBaht > 0) {
    const discBathPercent = parseFloat(discBath)/totalForDiscBaht*100
    const sqlBalance = `update balance 
        set R_DiscBath=R_Total*${discBathPercent}/100 
        where R_Table='${tableFile.Tcode}' and R_Void <> 'V' and R_LinkIndex = ''`
    await pool.query(sqlBalance)
  } else if(CuponDiscAmt>0) {
    const FIX_SUB_TYPE = '-C'
    const cuponInfo = await getTempCuponInfo(tableFile.Tcode)
    if(cuponInfo.length>0){
      await computeUpdateCuponSubTotal({ cuponInfo: cuponInfo[0], R_Table: tableFile.Tcode, FIX_SUB_TYPE })
    }

  } else if(FastDiscAmt>0) {
    const FIX_SUB_TYPE = '-F'
    const FIX_SUB_CODE = 'FAS'
    const FORMAT_DISC = fastDisc

    await computeUpdateSubTotal({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo: tableFile.Tcode })
  } else if(EmpDiscAmt>0) {
    const FIX_SUB_TYPE = '-E'
    const FIX_SUB_CODE = 'EMP'
    const FORMAT_DISC = empDisc

    await computeUpdateSubTotal({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo: tableFile.Tcode })
  } else if(MemDiscAmt>0) {
    const FIX_SUB_TYPE = '-M'
    const FIX_SUB_CODE = 'MEM'
    const FORMAT_DISC = memDisc

    await computeUpdateSubTotal({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo: tableFile.Tcode })
  } else if(TrainDiscAmt>0) {
    const FIX_SUB_TYPE = '-T'
    const FIX_SUB_CODE = 'TRA'
    const FORMAT_DISC = trainDisc
    
    await computeUpdateSubTotal({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo: tableFile.Tcode })
  } else if(SubDiscAmt>0) {
    const FIX_SUB_TYPE = '-S'
    const FIX_SUB_CODE = 'SUB'
    const FORMAT_DISC = subDisc
    
    await computeUpdateSubTotal({ FIX_SUB_TYPE, FIX_SUB_CODE, FORMAT_DISC, tableNo: tableFile.Tcode })
  }

  const sql = `update tablefile set 
        FastDisc='${fastDisc}',FastDiscAmt='${FastDiscAmt}',
        EmpDisc='${empDisc}',EmpDiscAmt='${EmpDiscAmt}',
        MemDisc='${memDisc}',MemDiscAmt='${MemDiscAmt}',
        TrainDisc='${trainDisc}',TrainDiscAmt='${TrainDiscAmt}',
        SubDisc='${subDisc}',SubDiscAmt='${SubDiscAmt}',
        DiscBath='${discBath}',CuponDiscAmt='${CuponDiscAmt}',
        SpaDiscAmt='${SpaDiscAmt}' 
        where Tcode='${tableFile.Tcode}'`
  await pool.query(sql)

  await summaryBalance(tableFile.Tcode, tableFile.MacNo)

  const discountAmount = FastDiscAmt + EmpDiscAmt + MemDiscAmt + TrainDiscAmt + SubDiscAmt + 
  discBath + CuponDiscAmt + SpaDiscAmt
  return {
    discountAmount: discountAmount
  }
}

const updateTableOpenStatus = async (tableNo, Cashier, TUser) => {
  const sql = `update tablefile 
    set TOnact='Y', Cashier='${Cashier}', TUser=${TUser} 
    where TCode='${tableNo}'`
  const results = await pool.query(sql)
  return results
}

const updateMoveTableStatus = async (
  sourceTable,
  targetTable,
  Cashier,
  TUser
) => {
  await updateTableAvailableStatus(sourceTable)
  await updateTableOpenStatus(targetTable, Cashier, TUser)
}

const updateMember = async (memberInfo, tableNo) => {
  const memBegin = getMoment(memberInfo.Member_AppliedDate).format("YYYY-MM-DD")
  const memEnd = getMoment(memberInfo.Member_ExpiredDate).format("YYYY-MM-DD")
  const sql = `UPDATE tablefile SET 
    MemCode='${memberInfo.Member_Code}',
    MemName='${Unicode2ASCII(memberInfo.Member_NameThai)}',
    MemBegin='${memBegin}',
    MemEnd='${memEnd}' 
    WHERE Tcode='${tableNo}'`
  const results = await pool.query(sql)
  return results
}

const getBalanceAllByTable = async (tableNo) => {
  const sql = `select * from balance  where R_Table='${tableNo}' order by r_index`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const checkTableOpen = async (tableNo) => {
  const sql = `select Cashier, TUser from tablefile where TOnact='Y' and TCode='${tableNo}'`
  const results = await pool.query(sql)
  const listTables = await getListTableByCode(tableNo)
  if (results.length > 0) {
    return {
      table: results[0],
      tableList: listTables
    }
  } else if (listTables.length > 0) {
    return {
      table: listTables[0],
      tableList: listTables
    }
  }
  
  return null
}

const updateTableFile = async (tablefile) => {
  const Tcode = tablefile.Tcode
  const SoneCode = tablefile.SoneCode
  const MacNo = tablefile.MacNo
  const Cashier = tablefile.Cashier
  const TCustomer = tablefile.TCustomer
  const TItem = tablefile.TItem
  const TAmount = tablefile.TAmount
  const TOnAct = tablefile.TOnAct
  const Service = tablefile.Service
  const ServiceAmt = tablefile.ServiceAmt
  const EmpDisc = tablefile.EmpDisc
  const EmpDiscAmt = tablefile.EmpDiscAmt
  const FastDisc = tablefile.FastDisc
  const FastDiscAmt = tablefile.FastDiscAmt
  const TrainDisc = tablefile.TrainDisc
  const TrainDiscAmt = tablefile.TrainDiscAmt
  const MemDisc = tablefile.MemDisc
  const MemDiscAmt = tablefile.MemDiscAmt
  const SubDisc = tablefile.SubDisc
  const SubDiscAmt = tablefile.SubDiscAmt
  const DiscBath = tablefile.DiscBath
  const ProDiscAmt = tablefile.ProDiscAmt
  const SpaDiscAmt = tablefile.SpaDiscAmt
  const CuponDiscAmt = tablefile.CuponDiscAmt
  const ItemDiscAmt = tablefile.ItemDiscAmt
  const MemCode = tablefile.MemCode
  const MemCurAmt = tablefile.MemCurAmt
  const MemName = Unicode2ASCII(tablefile.MemName)
  const Food = tablefile.Food
  const Drink = tablefile.Drink
  const Product = tablefile.Product
  const NetTotal = tablefile.NetTotal
  const PrintTotal = tablefile.PrintTotal
  const PrintChkBill = tablefile.PrintChkBill
  const PrintCnt = tablefile.PrintCnt
  const PrintTime1 = tablefile.PrintTime1
  const PrintTime2 = tablefile.PrintTime2
  const ChkBill = tablefile.ChkBill
  const ChkBillTime = tablefile.ChkBillTime
  const StkCode1 = tablefile.StkCode1
  const StkCode2 = tablefile.StkCode2
  const TDesk = tablefile.TDesk
  const TUser = tablefile.TUser
  const VoidMsg = Unicode2ASCII(tablefile.VoidMsg)
  const TPause = tablefile.TPause || ""
  const CCUseCode = tablefile.CCUseCode
  const TTableIsOn = tablefile.TTableIsOn || ""
  const TActive = tablefile.TActive || ""
  const TAutoClose = tablefile.TAutoClose || ""

  const sql = `UPDATE tablefile 
        SET Tcode='${Tcode}',SoneCode='${SoneCode}',MacNo='${MacNo}',Cashier='${Cashier}',
            TCurTime='${getCurrentTime()}',TCustomer='${TCustomer}',TItem='${TItem}',TAmount='${TAmount}',
            TOnAct='${TOnAct}',
            Service='${Service}',
            ServiceAmt='${ServiceAmt}',
            EmpDisc='${EmpDisc}',EmpDiscAmt='${EmpDiscAmt}',
            FastDisc='${FastDisc}',FastDiscAmt='${FastDiscAmt}',
            TrainDisc='${TrainDisc}',TrainDiscAmt='${TrainDiscAmt}',
            MemDisc='${MemDisc}',MemDiscAmt='${MemDiscAmt}',
            SubDisc='${SubDisc}',SubDiscAmt='${SubDiscAmt}',DiscBath='${DiscBath}',
            ProDiscAmt='${ProDiscAmt}',SpaDiscAmt='${SpaDiscAmt}',
            CuponDiscAmt='${CuponDiscAmt}',ItemDiscAmt='${ItemDiscAmt}',
            MemCode='${MemCode}',MemCurAmt='${MemCurAmt}',
            MemName='${MemName}',
            Food='${Food}',Drink='${Drink}',Product='${Product}',
            NetTotal='${NetTotal}',
            PrintTotal='${PrintTotal}',
            PrintChkBill='${PrintChkBill}',PrintCnt='${PrintCnt}',
            PrintTime1='${PrintTime1}',PrintTime2='${PrintTime2}',
            ChkBill='${ChkBill}',ChkBillTime='${ChkBillTime}',
            StkCode1='${StkCode1}',StkCode2='${StkCode2}',TDesk='${TDesk}',
            TUser='${TUser}',VoidMsg='${VoidMsg}',TPause='${TPause}',
            CCUseCode='${CCUseCode}',
            TTableIsOn='${TTableIsOn}',TActive='${TActive}',TAutoClose='${TAutoClose}' 
            WHERE Tcode='${Tcode}'`

  const results = await pool.query(sql)
  return results
}

const getTableByCode = async (tableNo) => {
  const sql = `select * from tablefile where Tcode='${tableNo}' limit 1`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

const getListTableByCode = async (tableNo) => {
  const sql = `select * from tablefile where (Tcode like '${tableNo}-%' or Tcode='${tableNo}')`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const tableMoveOrGroup = async (sourceTable, targetTable, admin, Cashier) => {
  const sourceTableData = await getTableByCode(sourceTable)
  const targetTableData = await getTableByCode(targetTable)

  if (!sourceTableData || !targetTableData) {
    return {
      invalid: true,
      message: "ท่านกำหนดเบอร์โต๊ะไม่ถูกต้อง กรุณาตรวจสอบ !!!"
    }
  }
  if (sourceTableData.Tcode === targetTableData.Tcode) {
    return {
      invalid: true,
      message: "ท่านกำหนดเบอร์โต๊ะไม่ถูกต้อง กรุณาตรวจสอบ !!!"
    }
  }

  const balanceFrom = await getBalanceAllByTable(sourceTable)
  if (balanceFrom.length === 0) {
    return {
      invalid: true,
      message: "ไม่พบข้อมูลที่ต้องการย้าย !!!"
    }
  }

  // add source balance into target balance
  for (let i = 0; i < balanceFrom.length; i++) {
    const newBalance = { ...balanceFrom[i] }
    newBalance.R_Index = await getBalanceMaxIndex(targetTable)
    newBalance.R_MoveFrom = balanceFrom[i].R_Index
    newBalance.R_MoveUser = admin
    newBalance.R_Table = targetTable

    await updateBalanceMove(newBalance, balanceFrom[i].R_Table)
  }

  // update source table to available status
  await updateMoveTableStatus(sourceTable, targetTable, Cashier, admin)
  return {
    status: 2000,
    message: "ย้ายโต๊ะสำเร็จ"
  }
}

const createTableForSplitPayment = async (sourceTableData, targetTableNo) => {
  const curdate = getMoment().format("YYYY-MM-DD")
  const MemBegin = getMoment(sourceTableData.MemBegin).format("YYYY-MM-DD")
  const MemEnd = getMoment(sourceTableData.MemEnd).format("YYYY-MM-DD")
  const {
    SoneCode,
    MacNo,
    Cashier,
    TLoginTime,
    TCurTime,
    TCustomer,
    TItem,
    TAmount,
    TOnAct,
    Service,
    ServiceAmt,
    EmpDisc,
    EmpDiscAmt,
    FastDisc,
    FastDiscAmt,
    TrainDisc,
    TrainDiscAmt,
    MemDisc,
    MemDiscAmt,
    SubDisc,
    SubDiscAmt,
    DiscBath,
    ProDiscAmt,
    SpaDiscAmt,
    CuponDiscAmt,
    ItemDiscAmt,
    MemCode,
    MemCurAmt,
    MemName,
    Food,
    Drink,
    Product,
    NetTotal,
    PrintTotal,
    PrintChkBill,
    PrintCnt,
    PrintTime1,
    PrintTime2,
    ChkBill,
    ChkBillTime,
    StkCode1,
    StkCode2,
    TDesk,
    TUser,
    VoidMsg,
    TPause,
    CCUseCode,
    CCUseAmt,
    TTableIsOn,
    TActive,
    TAutoClose
  } = sourceTableData
  const newTable = { ...sourceTableData }
  newTable.Tcode = targetTableNo
  newTable.TTableIsOn = TTableIsOn || ""
  newTable.TActive = TActive || ""
  newTable.TAutoClose = TAutoClose || ""
  newTable.CCUseAmt = CCUseAmt || 0
  newTable.VoidMsg = Unicode2ASCII(VoidMsg)
  const sql = `INSERT INTO tablefile 
            (Tcode,SoneCode,TLoginDate,MacNo,Cashier,TLoginTime,TCurTime,TCustomer,TItem,TAmount,TOnAct,Service,ServiceAmt,EmpDisc,EmpDiscAmt,
            FastDisc,FastDiscAmt,TrainDisc,TrainDiscAmt,MemDisc,MemDiscAmt,SubDisc,SubDiscAmt,DiscBath,ProDiscAmt,SpaDiscAmt,CuponDiscAmt,
            ItemDiscAmt,MemCode,MemCurAmt,MemName,MemBegin,MemEnd,Food,Drink,Product,NetTotal,PrintTotal,PrintChkBill,PrintCnt,
            PrintTime1,PrintTime2,ChkBill,ChkBillTime,StkCode1,StkCode2,TDesk,TUser,VoidMsg,TPause,CCUseCode,CCUseAmt,TTableIsOn,TActive,TAutoClose) 
            VALUES ('${targetTableNo}','${SoneCode}','${curdate}','${MacNo}','${Cashier}','${TLoginTime}','${TCurTime}','${TCustomer}','${TItem}','${TAmount}',
            '${TOnAct}','${Service}','${ServiceAmt}','${EmpDisc}','${EmpDiscAmt}','${FastDisc}','${FastDiscAmt}','${TrainDisc}','${TrainDiscAmt}',
            '${MemDisc}','${MemDiscAmt}','${SubDisc}','${SubDiscAmt}','${DiscBath}','${ProDiscAmt}','${SpaDiscAmt}','${CuponDiscAmt}','${ItemDiscAmt}',
            '${MemCode}','${MemCurAmt}','${MemName}','${MemBegin}','${MemEnd}','${Food}','${Drink}','${Product}','${NetTotal}','${PrintTotal}',
            '${PrintChkBill}','${PrintCnt}','${PrintTime1}','${PrintTime2}','${ChkBill}','${ChkBillTime}','${StkCode1}','${StkCode2}','${TDesk}',
            '${TUser}','${newTable.VoidMsg}','${TPause}','${CCUseCode}','${newTable.CCUseAmt}','${newTable.TTableIsOn}','${newTable.TActive}','${newTable.TAutoClose}')`
  const checkExistTable = await getTableByCode(targetTableNo)
  if (checkExistTable) {
    checkExistTable.MacNo = MacNo
    await updateTableFile(checkExistTable)
  } else {
    await pool.query(sql)
  }

  return { ...newTable }
}

const splitTableToPayment = async (
  sourceTable,
  targetTable,
  orderListToMove,
  macno
) => {
  const sourceTableData = await getTableByCode(sourceTable)
  const targetTableData = await createTableForSplitPayment(
    sourceTableData,
    targetTable
  )

  if (!sourceTableData || !targetTableData) {
    return {
      invalid: true,
      message: "ไม่สามารถสร้างบิลสำหรับแยกชำระได้ กรุณาตรวจสอบ !!!"
    }
  }

  if (sourceTableData.Tcode === targetTableData.Tcode) {
    return {
      invalid: true,
      message: "ข้อมูลบิลสำหรับแยกชำระ ไม่ถูกต้อง กรุณาตรวจสอบ !!!"
    }
  }

  const balanceFrom = await getBalanceAllByTable(sourceTable)
  if (balanceFrom.length === 0) {
    return {
      invalid: true,
      message: "ไม่พบข้อมูลสินค้าที่ต้องการแยกชำระ !!!"
    }
  }

  // add source balance into target balance only orderListToMove
  for (let i = 0; i < orderListToMove.length; i++) {
    const newBalance = { ...orderListToMove[i] }
    newBalance.R_Index = orderListToMove[i].R_Index
    newBalance.R_Table = targetTable

    await updateBalanceSplitBill(newBalance, orderListToMove[i].R_Table)
  }

  // summary balance in table
  await summaryBalance(sourceTable, macno)
  await summaryBalance(targetTable, macno)
}

module.exports = {
  updateTableAvailableStatus,
  updateTableOpenStatus,
  checkTableOpen,
  updateMember,
  updateTableFile,
  getAllTable,
  getCheckTableStatus,
  tableMoveOrGroup,
  getBalanceAllByTable,
  getTableByCode,
  splitTableToPayment,
  updateTableDiscount,
  getListTableByCode
}
