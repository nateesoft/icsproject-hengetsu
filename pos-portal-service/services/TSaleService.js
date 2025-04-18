const pool = require('../config/database/MySqlConnect');
const { mappingResultDataList } = require('../utils/ConvertThai');
const { getMoment } = require('../utils/MomentUtil');
const { Unicode2ASCII, ASCII2Unicode } = require('../utils/StringUtil');
const { listIngredeint, getPSetByPCode, getPCategoryByRLinkIndex } = require('./ProductService');
const { ProcessStockOut } = require('./STCardService');

const getAllTSale = async () => {
    const sql = `select * from t_sale order by R_Index`
    const results = await pool.query(sql)
    
    return mappingResultDataList(results)
}

const getAllTSaleByRefno = async (refno) => {
    const sql = `select * from t_sale where R_Refno='${refno}' order by R_Index`
    const results = await pool.query(sql)

    return mappingResultDataList(results)
}

const createNewTSale = async (balance, BillRefNo) => {
    const { R_Table, Macno, R_PluCode, R_PName, R_Unit, R_Group, R_Status, R_Normal,
        R_Discount, R_Service, R_Stock, R_Set, R_Vat, R_Type, R_ETD, R_Quan, R_Price, R_Total, R_PrType, R_PrCode, R_PrDisc,
        R_PrBath, R_PrAmt, R_DiscBath, R_PrCuType, R_PrCuQuan, R_PrCuAmt, R_Redule, R_Kic, R_KicPrint, R_Void, R_VoidUser,
        R_VoidTime, R_Opt1, R_Opt2, R_Opt3, R_Opt4, R_Opt5, R_Opt6, R_Opt7, R_Opt8, R_Opt9, R_PrCuCode,
        StkCode, PosStk, R_PrChkType, R_PrQuan, R_PrSubType, R_PrSubCode, R_PrSubQuan, R_PrSubDisc,
        R_PrSubBath, R_PrSubAmt, R_PrSubAdj, R_PrCuDisc, R_PrCuBath, R_PrCuAdj, R_PItemNo, R_PKicQue,
        R_PrVcType="", R_PrVcCode, R_PrVcAmt, R_PrVcAdj, R_MoveFlag, R_Pause, R_SPIndex,
        R_LinkIndex, R_VoidPause, R_MoveItem, R_MoveFrom, R_MoveUser, VoidMsg, R_PrintItemBill, R_CountTime,
        R_Earn, R_EarnNo } = balance

    const R_Refno = BillRefNo;
    const R_Index = BillRefNo + "/" + balance.R_Index
    const Cashier = balance.Cashier; // can change
    const R_Emp = balance.R_Emp; // can change
    const R_Date = getMoment().format('YYYY-MM-DD');
    const R_Time = getMoment().format('HH:mm:ss');
    const MacNo = Macno;
    const R_PrAdj = 0;
    const R_PreDisAmt = 0;
    const R_NetTotal = 0;
    const R_Refund = "";
    const R_PrChkType2 = "";
    const R_PrQuan2 = 0;
    const R_PrType2 = "";
    const R_PrCode2 = "";
    const R_PrDisc2 = 0;
    const R_PrBath2 = 0;
    const R_PrAmt2 = 0;
    const R_PrAdj2 = 0;
    const R_SetPrice = 0;
    const R_SetDiscAmt = 0;
    const R_Return = "";
    const R_NetDiff = 0;
    const R_SendOnline = "";
    const R_BranchCode = "";
    const R_ServiceAmt = 0;
    const R_CardPay = "";

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
    const getVoidMsg = Unicode2ASCII(VoidMsg)


    const sql = `INSERT INTO t_sale 
        (R_Index,R_Refno,R_Table,R_Date,R_Time,MacNo,Cashier,R_Emp,R_PluCode,R_PName,R_Unit,R_Group,R_Status,R_Normal,
        R_Discount,R_Service,R_Stock,R_Set,R_Vat,R_Type,R_ETD,R_Quan,R_Price,R_Total,R_PrType,R_PrCode,R_PrDisc,R_PrBath,
        R_PrAmt,R_PrCuType,R_PrCuCode,R_PrCuQuan,R_PrCuAmt,R_Redule,R_DiscBath,R_PrAdj,R_PreDisAmt,R_NetTotal,R_Kic,
        R_KicPrint,R_Refund,VoidMsg,R_Void,R_VoidUser,R_VoidTime,StkCode,PosStk,R_ServiceAmt,R_PrChkType,R_PrQuan,
        R_PrSubType,R_PrSubCode,R_PrSubQuan,R_PrSubDisc,R_PrSubBath,R_PrSubAmt,R_PrSubAdj,R_PrCuDisc,R_PrCuBath,
        R_PrCuAdj,R_PrChkType2,R_PrQuan2,R_PrType2,R_PrCode2,R_PrDisc2,R_PrBath2,R_PrAmt2,R_PrAdj2,R_PItemNo,
        R_PKicQue,R_PrVcType,R_PrVcCode,R_PrVcAmt,R_PrVcAdj,R_MoveFlag,R_Pause,R_SPIndex,R_LinkIndex,R_VoidPause,
        R_SetPrice,R_SetDiscAmt,R_MoveItem,R_MoveFrom,R_MoveUser,R_Opt9,R_Opt1,R_Opt2,R_Opt3,R_Opt4,R_Opt5,R_Opt6,R_Opt7,R_Opt8,
        R_PrintItemBill,R_CountTime,R_Return,R_Earn,R_EarnNo,R_NetDiff,R_SendOnline,R_BranchCode,R_CardPay) 
        VALUES ('${R_Index}','${R_Refno}','${R_Table}','${R_Date}','${R_Time}','${MacNo}','${Cashier}','${R_Emp}','${R_PluCode}',
        '${RPName}','${R_Unit}','${R_Group}','${R_Status}','${R_Normal}','${R_Discount}','${R_Service}','${R_Stock}','${R_Set}',
        '${R_Vat}','${R_Type}','${R_ETD}','${R_Quan}','${R_Price}','${R_Total}','${R_PrType}','${R_PrCode}','${R_PrDisc}','${R_PrBath}',
        '${R_PrAmt}','${R_PrCuType}','${R_PrCuCode}','${R_PrCuQuan}','${R_PrCuAmt}','${R_Redule}','${R_DiscBath}','${R_PrAdj}',
        '${R_PreDisAmt}','${R_NetTotal}','${R_Kic}','${R_KicPrint}','${R_Refund}','${getVoidMsg}','${R_Void}','${R_VoidUser}','${R_VoidTime}',
        '${StkCode}','${PosStk}','${R_ServiceAmt}','${R_PrChkType}','${R_PrQuan}','${R_PrSubType}','${R_PrSubCode}','${R_PrSubQuan}',
        '${R_PrSubDisc}','${R_PrSubBath}','${R_PrSubAmt}','${R_PrSubAdj}','${R_PrCuDisc}','${R_PrCuBath}','${R_PrCuAdj}','${R_PrChkType2}',
        '${R_PrQuan2}','${R_PrType2}','${R_PrCode2}','${R_PrDisc2}','${R_PrBath2}','${R_PrAmt2}','${R_PrAdj2}','${R_PItemNo}',
        '${R_PKicQue}','${R_PrVcType}','${R_PrVcCode}','${R_PrVcAmt}','${R_PrVcAdj}','${R_MoveFlag}','${R_Pause}','${R_SPIndex}',
        '${R_LinkIndex}','${R_VoidPause}','${R_SetPrice}','${R_SetDiscAmt}','${R_MoveItem}','${R_MoveFrom}','${R_MoveUser}','${ROpt9}',
        '${ROpt1}','${ROpt2}','${ROpt3}','${ROpt4}','${ROpt5}','${ROpt6}','${ROpt7}','${ROpt8}','${R_PrintItemBill}',
        '${R_CountTime}','${R_Return}','${R_Earn}','${R_EarnNo}','${R_NetDiff}','${R_SendOnline}','${R_BranchCode}','${R_CardPay}')`;
    const results = await pool.query(sql)
    return results
}

const processAllPIngredent = async (S_No, PCode, R_Quan, Cashier) => {
    let listING = await listIngredeint(PCode);
    listING && listING.forEach(async (ingBean, index) => {
        if (ingBean.pstock === "Y" && ingBean.pactive === "Y") {
            let PBPack = ingBean.PBPack;
            if (PBPack <= 0) {
                PBPack = 1;
            }
            let R_QuanIng = ingBean.PingQty * R_Quan;

            const S_SubNo = "@" + ingBean.PCode
            const S_Que = (index + 1)
            const S_PCode = ingBean.PingCode
            const S_In = 0
            const S_Out = R_QuanIng
            const S_InCost = 0
            const S_OutCost = 0
            const S_ACost = 0
            const S_Rem = "SAL"
            const S_User = Cashier
            const S_Link = "@" + ingBean.PCode

            const PStock = "Y"
            const PSet = "N"
            const r_index = ""
            const SaleOrRefund = "SALE" // SALE or REFUND

            await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost, S_OutCost,
                S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund);
        }
    })
}

const processAllPIngredentReturnStock = async (S_No, PCode, R_Quan, Cashier) => {
    let listING = await listIngredeint(PCode);
    listING && listING.forEach(async (ingBean, index) => {
        if (ingBean.pstock === "Y" && ingBean.pactive === "Y") {
            let PBPack = ingBean.PBPack;
            if (PBPack <= 0) {
                PBPack = 1;
            }
            let R_QuanIng = ingBean.PingQty * R_Quan;

            const S_SubNo = "@" + ingBean.PCode
            const S_Que = (index + 1)
            const S_PCode = ingBean.PingCode
            const S_In = R_QuanIng
            const S_Out = 0
            const S_InCost = 0
            const S_OutCost = 0
            const S_ACost = 0
            const S_Rem = "SAL"
            const S_User = Cashier
            const S_Link = "@" + ingBean.PCode

            const PStock = "Y"
            const PSet = "N"
            const r_index = ""
            const SaleOrRefund = "VOID" // SALE or REFUND

            await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost, S_OutCost,
                S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund);
        }
    })
}

const processAllPSet = async (S_No, PCode, R_Quan, Cashier) => {
    let listPset = await getPSetByPCode(PCode);
    listPset && listPset.forEach(async psetBean => {
        const S_SubNo = ""
        const S_Que = 0
        const S_PCode = psetBean.PSubCode
        const S_In = 0
        const S_Out = R_Quan * psetBean.PSubQty
        const S_InCost = 0
        const S_OutCost = 0
        const S_ACost = 0
        const S_Rem = "SAL"
        const S_User = Cashier
        const S_Link = ""

        const PStock = "N"
        const PSet = "N"
        const r_index = ""
        const SaleOrRefund = "SALE" // SALE or REFUND

        await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost,
            S_OutCost, S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund);
    })
}

const processAllPSetReturn = async (S_No, PCode, R_Quan, Cashier) => {
    let listPset = await getPSetByPCode(PCode);
    listPset.forEach(async psetBean => {
        const S_SubNo = ""
        const S_Que = 0
        const S_PCode = psetBean.PSubCode
        const S_In = R_Quan * psetBean.PSubQty
        const S_Out = 0
        const S_InCost = 0
        const S_OutCost = 0
        const S_ACost = 0
        const S_Rem = "SAL"
        const S_User = Cashier
        const S_Link = ""

        const PStock = "N"
        const PSet = "N"
        const r_index = ""
        const SaleOrRefund = "VOID" // SALE or REFUND

        await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost,
            S_OutCost, S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund);
    })
}

const processAllGroupSetReturn = async (R_Index, R_Table, R_Quan, Cashier, empCode, voidMsg, macno) => {
    let listGroupBalance = await getPCategoryByRLinkIndex(R_Index);
    listGroupBalance.forEach(async balance => {
        // update stock and process stockcard and stkfile
        if (balance.R_Stock === 'Y' && balance.R_Void !== 'V') {
            const S_No = R_Table + "-" + getMoment().format('HH:mm:ss')
            const S_SubNo = ""
            const S_Que = 0
            const S_PCode = balance.R_PluCode
            const S_In = R_Quan
            const S_Out = 0
            const S_InCost = balance.R_Total
            const S_OutCost = 0
            const S_ACost = 0
            const S_Rem = "SAL"
            const S_User = Cashier
            const S_Link = ""

            const PStock = balance.R_Stock
            const PSet = balance.R_Set
            const r_index = balance.R_Index
            const SaleOrRefund = "VOID" // SALE or REFUND

            await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost,
                S_OutCost, S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund);

            // ตัดสต็อกสินค้าที่มี Ingredent
            await processAllPIngredentReturnStock(S_No, balance.R_PluCode, balance.R_Quan, Cashier)

            // ตัดสต็อกสินค้าที่เป็นชุด SET (PSET)
            await processAllPSetReturn(balance.R_PluCode, balance.R_Quan, Cashier)
        }

        let updBalance = `UPDATE balance 
                SET r_void='V',
                cashier='${Cashier}',
                r_emp='${empCode}',
                r_voiduser='${Cashier}',
                r_voidtime=curtime(),
                r_discbath='0',
                macno='${macno}',
                r_kicprint='',
                r_opt9='${Unicode2ASCII(voidMsg)}',
                voidmsg='${Unicode2ASCII(voidMsg)}' 
                WHERE r_index='${balance.R_Index}' and r_table='${balance.R_Table}'`;
        await pool.query(updBalance)
    })
}

const addDataFromBalance = async (tableNo, BillRefNo, allBalance) => {
    // loop insert
    allBalance && allBalance.forEach(async balance => {

        // new t_sale
        await createNewTSale(balance, BillRefNo)
    })
}

module.exports = {
    addDataFromBalance,
    processAllPIngredent,
    processAllPIngredentReturnStock,
    processAllPSet,
    processAllPSetReturn,
    getAllTSale,
    getAllTSaleByRefno,
    processAllGroupSetReturn
}
