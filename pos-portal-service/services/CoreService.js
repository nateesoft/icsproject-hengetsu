const pool = require("../config/database/MySqlConnect")
const { mappingResultData, mappingResultDataList } = require("../utils/ConvertThai")
const { getCurrentTime } = require("../utils/MomentUtil")

const { PrefixZeroFormat, Unicode2ASCII } = require("../utils/StringUtil")

const getBalanceByRIndex = async (R_Index) => {
  const sql = `select * from balance 
    where R_Index='${R_Index}' order by R_Table, R_Index`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

const getBalanceMaxIndex = async (tableNo) => {
  const sql = `select max(R_Index) R_Index from balance 
    where R_Table='${tableNo}' order by r_index`
  const results = await pool.query(sql)

  let id = 1
  let index = tableNo + "/001" // default

  if (results.length > 0) {
    const R_Index = results[0].R_Index
    if (R_Index) {
      let data = R_Index.split("/")
      id = parseInt(data[1]) + 1

      index = tableNo + "/" + PrefixZeroFormat(id, 3)
    }
  }

  return index
}

const updateBalanceMove = async (balanceData, sourceTableNo) => {
  const sql = `update balance set 
    R_Table='${balanceData.R_Table}',
    R_Index='${balanceData.R_Index}', 
    R_MoveFrom='${balanceData.R_MoveFrom}' 
    where R_Table='${sourceTableNo}' and R_Index='${balanceData.R_MoveFrom}'`
  const results = await pool.query(sql)
  return results
}

const updateBalanceSplitBill = async (balanceData, sourceTableNo) => {
  const sql = `update balance set 
    R_Table='${balanceData.R_Table}' 
    where R_Table='${sourceTableNo}' and R_Index='${balanceData.R_Index}'`
  const results = await pool.query(sql)

  // check R_LinkIndex
  const sqlCheck = `select * from balance where R_LinkIndex='${balanceData.R_Index}'`
  const resultChk = await pool.query(sqlCheck)
  for(let index in resultChk){
    const balance = resultChk[index]
    const sql = `update balance set 
      R_Table='${balanceData.R_Table}' 
      where R_Table='${sourceTableNo}' and R_Index='${balance.R_Index}'`
      const results1 = await pool.query(sql)
  }

  return results
}

const getTableByCode = async (tableNo) => {
  const sql = `select * from tablefile where TCode='${tableNo}' limit 1`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

const getBalanceByTable = async (tableNo) => {
  const sql = `select * from balance where R_Table='${tableNo}' and R_Void <> 'V' order by r_index`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const getSummaryItem = async (tableNo) => {
  const sql = `select sum(R_Quan) R_Quan from balance where R_Table='${tableNo}' and R_Void <> 'V' and R_LinkIndex=''`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return results[0].R_Quan
  }
  return 0.0
}

const getPOSConfigSetup = async () => {
  const sql = `select * from posconfigsetup limit 1`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

const updateTableFile = async (tablefile) => {
  const Tcode = tablefile.Tcode
  const SoneCode = tablefile.SoneCode
  const MacNo = tablefile.MacNo
  const Cashier = tablefile.Cashier
  const TCustomer = tablefile.TCustomer || 0
  const TItem = tablefile.TItem || 0
  const TAmount = tablefile.TAmount || 0
  const TOnAct = tablefile.TOnAct
  const Service = tablefile.Service
  const ServiceAmt = tablefile.ServiceAmt || 0
  const EmpDisc = tablefile.EmpDisc
  const EmpDiscAmt = tablefile.EmpDiscAmt || 0
  const FastDisc = tablefile.FastDisc
  const FastDiscAmt = tablefile.FastDiscAmt || 0
  const TrainDisc = tablefile.TrainDisc
  const TrainDiscAmt = tablefile.TrainDiscAmt || 0
  const MemDisc = tablefile.MemDisc
  const MemDiscAmt = tablefile.MemDiscAmt || 0
  const SubDisc = tablefile.SubDisc
  const SubDiscAmt = tablefile.SubDiscAmt || 0
  const DiscBath = tablefile.DiscBath
  const ProDiscAmt = tablefile.ProDiscAmt || 0
  const SpaDiscAmt = tablefile.SpaDiscAmt || 0
  const CuponDiscAmt = tablefile.CuponDiscAmt || 0
  const ItemDiscAmt = tablefile.ItemDiscAmt || 0
  const MemCode = tablefile.MemCode
  const MemCurAmt = tablefile.MemCurAmt || 0
  const MemName = Unicode2ASCII(tablefile.MemName)
  const Food = tablefile.Food
  const Drink = tablefile.Drink
  const Product = tablefile.Product
  const NetTotal = tablefile.NetTotal || 0
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

  const subTotalAmt = tablefile.SubTotal_Amt || 0

  // add vat info
  const Vat = tablefile.Vat
  const VatAmt = tablefile.VatAmt

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
            TTableIsOn='${TTableIsOn}',
            TActive='${TActive}',TAutoClose='${TAutoClose}',
            Vat='${Vat}',VatAmt='${VatAmt}',SubTotal_Amt='${subTotalAmt}' 
            WHERE Tcode='${Tcode}'`

  const results = await pool.query(sql)
  return results
}

const computeBalanceSummary = (
  balanceList,
  Food,
  Drink,
  Product,
  FoodService,
  DrinkService,
  ProductService,
  FoodVat,
  DrinkVat,
  ProductVat,
  totalDiscountAmount,
  totalItemDiscAmount,
  totalServiceAmount,
  totalVatAmount,
  totalProductNoneVatAmount,
  service,
  serviceType,
  vat,
  vatType,
  netTotalAmount
) => {
  balanceList.forEach((balance) => {

    if(balance.R_Total > 0){

      // compute RNetTotal
      let RNetTotal = balance.R_Price * balance.R_Quan
      let sumDiscountAll = balance.R_DiscBath + balance.R_PrSubAmt + balance.R_PrAmt + balance.R_PrCuAmt

      if (balance.R_Service === "Y" && balance.R_Vat === "V") {
        let vatAmount = 0
        let serviceCharge = 0
        let subTotalAmount = 0
        let productNonVat = 0

        if (serviceType === "N" && vatType === "I") { // คิด service แบบ Net & คิด vat แบบ Include
          productNonVat = RNetTotal  // ถอด vat ออกจากสินค้า
          let totalAmount = RNetTotal - sumDiscountAll // ลบส่วนลด
          serviceCharge = totalAmount * service / 100 // คิด service หลังจากหักส่วนลด
          totalAmount = totalAmount + serviceCharge
          vatAmount = RNetTotal*vat/(100+vat)
          subTotalAmount = totalAmount
        } else if (serviceType === "N" && vatType === "E") { // คิด service แบบ Net & คิด vat แบบ Exclude
          productNonVat = RNetTotal
          let totalAmount = RNetTotal - sumDiscountAll
          serviceCharge = totalAmount * service / 100
          totalAmount = totalAmount + serviceCharge
          vatAmount = totalAmount*vat/100
          subTotalAmount = totalAmount + vatAmount
        } else if (serviceType === "G" && vatType === "I") { // คิด service แบบ Gross & คิด vat แบบ Include
          productNonVat = RNetTotal - RNetTotal*vat/(100+vat)// ถอด vat ออกจากสินค้า
          let totalAmount = productNonVat - sumDiscountAll
          serviceCharge = RNetTotal * service/100
          totalAmount = totalAmount + serviceCharge
          vatAmount = totalAmount * vat/100
          subTotalAmount = totalAmount + vatAmount
        } else if (serviceType === "G" && vatType === "E") { // คิด service แบบ Net & คิด vat แบบ Exclude
          let totalAmount = RNetTotal - sumDiscountAll
          serviceCharge = RNetTotal * service/100
          totalAmount = totalAmount + serviceCharge
          vatAmount = totalAmount * vat/100
          subTotalAmount = totalAmount + vatAmount
        }

        totalDiscountAmount += sumDiscountAll
        totalItemDiscAmount += balance.R_PrAmt
        totalServiceAmount += serviceCharge
        totalVatAmount += vatAmount
        totalProductNoneVatAmount += productNonVat
        netTotalAmount += subTotalAmount
      } else if (balance.R_Service === "Y" && balance.R_Vat === "N") { // ไม่คิดภาษี
        let vatAmount = 0
        let serviceCharge = 0
        let subTotalAmount = 0
        let productNonVat = RNetTotal

        if (serviceType === "N") { // คิด service แบบ Net
            if (vatType === "I") {
              productNonVat = productNonVat = RNetTotal - (RNetTotal * vat / (100 + vat))
              let totalAmount = productNonVat - balance.R_DiscBath
              serviceCharge = totalAmount * service / 100
              subTotalAmount = totalAmount + serviceCharge
            } else if(vatType === "E") {
              let totalAmount = RNetTotal - balance.R_DiscBath
              serviceCharge = totalAmount * service / 100
              subTotalAmount = totalAmount + serviceCharge
            }
        } else if (serviceType === "G") { // คิด service แบบ Gross
          if (vatType === "I") {
            productNonVat = productNonVat = RNetTotal - (RNetTotal * vat / (100 + vat))
            let totalAmount = productNonVat - balance.R_DiscBath
            serviceCharge = RNetTotal * service/100
            subTotalAmount = totalAmount + serviceCharge
          } else if(vatType === "E") {
            let totalAmount = RNetTotal - balance.R_DiscBath
            serviceCharge = RNetTotal * service/100
            subTotalAmount = totalAmount + serviceCharge
          }
        }

        totalDiscountAmount += balance.R_DiscBath
        totalItemDiscAmount += balance.R_PrAmt
        totalServiceAmount += serviceCharge
        totalVatAmount += 0
        totalProductNoneVatAmount += productNonVat
        netTotalAmount += subTotalAmount
      } else if (balance.R_Service === "N" && balance.R_Vat === "V") { // ไม่คิด Service
        let serviceCharge = 0
        let vatAmount = 0
        let subTotalAmount = 0
        let productNonVat = 0

        if (vatType === "I") { // คิด vat แบบ Include
          productNonVat = RNetTotal - (RNetTotal * vat / (100 + vat))
          let totalAmount = productNonVat - balance.R_DiscBath
          vatAmount = totalAmount * vat / 100
          subTotalAmount = totalAmount + vatAmount
        } else if (vatType === "E") { // คิด vat แบบ Exclude
          let totalAmount = RNetTotal - balance.R_DiscBath
          vatAmount = totalAmount * vat / 100
          subTotalAmount = totalAmount + vatAmount
        }

        totalDiscountAmount += balance.R_DiscBath
        totalItemDiscAmount += balance.R_PrAmt
        totalServiceAmount += serviceCharge
        totalVatAmount += vatAmount
        totalProductNoneVatAmount += productNonVat
        netTotalAmount += subTotalAmount
      } else if (balance.R_Service === "N" && balance.R_Vat === "N") { // ไม่คิดภาษี และ Service
        totalServiceAmount += 0
        totalVatAmount += 0
        totalProductNoneVatAmount += RNetTotal
        netTotalAmount += RNetTotal
      }

      if (balance.R_Type === '1') {
        Food += RNetTotal
        if (balance.R_Service === "Y") {
          FoodService = RNetTotal
        }
        if (balance.R_Vat === "V") {
          FoodVat = RNetTotal
        }
      } else if (balance.R_Type === '2') {
        Drink += RNetTotal
        if (balance.R_Service === "Y") {
          DrinkService = RNetTotal
        }
        if (balance.R_Vat === "V") {
          DrinkVat = RNetTotal
        }
      } else if (balance.R_Type === '3') {
        Product += RNetTotal
        if (balance.R_Service === "Y") {
          ProductService = RNetTotal
        }
        if (balance.R_Vat === "V") {
          ProductVat = RNetTotal
        }
      }

    }
  })

  return {
    Food,
    Drink,
    Product,
    FoodService,
    DrinkService,
    ProductService,
    FoodVat,
    DrinkVat,
    ProductVat,
    totalProductNoneVatAmount,
    totalDiscountAmount,
    totalItemDiscAmount,
    totalServiceAmount,
    totalVatAmount,
    netTotalAmount
  }
}

const summaryBalance = async (tableNo, macno) => {
  const tablefile = await getTableByCode(tableNo)
  const configSetup = await getPOSConfigSetup()
  const balanceList = await getBalanceByTable(tableNo)
  const totalItem = await getSummaryItem(tableNo)

  const service = configSetup.P_Service
  const serviceType = configSetup.P_ServiceType // Net(N), Gross(G)
  const vatType = configSetup.P_VatType // Include(I) or Exclude(E)
  const vat = configSetup.P_Vat

  let Food = 0
  let Drink = 0
  let Product = 0

  let FoodService = 0
  let DrinkService = 0
  let ProductService = 0

  let FoodVat = 0
  let DrinkVat = 0
  let ProductVat = 0

  let totalDiscountAmount = 0
  let totalItemDiscAmount = 0
  let totalServiceAmount = 0
  let totalVatAmount = 0
  let totalProductNoneVatAmount = 0

  let netTotalAmount = 0

  const responseData = computeBalanceSummary(
    balanceList,
    Food,
    Drink,
    Product,
    FoodService,
    DrinkService,
    ProductService,
    FoodVat,
    DrinkVat,
    ProductVat,
    totalDiscountAmount,
    totalItemDiscAmount,
    totalServiceAmount,
    totalVatAmount,
    totalProductNoneVatAmount,
    service,
    serviceType,
    vat,
    vatType,
    netTotalAmount
  )

  tablefile.MacNo = macno
  tablefile.Service = service
  tablefile.Vat = vat
  tablefile.TAmount = responseData.Food + responseData.Drink + responseData.Product
  tablefile.ServiceAmt = responseData.totalServiceAmount
  tablefile.SubTotal_Amt = tablefile.TAmount + tablefile.ServiceAmt
  tablefile.ItemDiscAmt = responseData.totalItemDiscAmount
  tablefile.VatAmt = responseData.totalVatAmount
  tablefile.NetTotal = responseData.netTotalAmount
  tablefile.Food = responseData.Food
  tablefile.Drink = responseData.Drink
  tablefile.Product = responseData.Product

  tablefile.TItem = totalItem

  // update tablefile
  await updateTableFile(tablefile)

  return {
    TItem: tablefile.TItem,
    TAmount: tablefile.TAmount,
    DiscountAmount: responseData.totalDiscountAmount,
    SubTotal_Amt: tablefile.SubTotal_Amt,
    NetTotal: Math.round(tablefile.NetTotal),
    NetDiff: parseFloat((tablefile.NetTotal-Math.round(tablefile.NetTotal)).toFixed(2)),
    ProductAndService: tablefile.TAmount + tablefile.ServiceAmt,
    Food: tablefile.Food,
    Drink: tablefile.Drink,
    Product: tablefile.Product,
    PrintRecpMessage: configSetup.P_PrintRecpMessage,
    Vat: tablefile.Vat,
    VatType: vatType,
    VatAmount: responseData.totalVatAmount,
    Service: tablefile.Service,
    ServiceType: serviceType,
    ServiceAmt: tablefile.ServiceAmt,
    ProductNonVat: responseData.totalProductNoneVatAmount
  }
}

module.exports = {
  getBalanceByRIndex,
  updateBalanceMove,
  getBalanceMaxIndex,
  updateBalanceSplitBill,
  summaryBalance,
  getPOSConfigSetup
}
