const pool = require('../config/database/MySqlConnect')
const { PrefixZeroFormat, Unicode2ASCII } = require('../utils/StringUtil');

const { getProductByPCode } = require('./ProductService');
const { ProcessStockOut } = require('./STCardService');
const { processAllPIngredent, processAllPSet, processAllPIngredentReturnStock, processAllPSetReturn, processAllGroupSetReturn } = require('./TSaleService');
const { getMoment } = require('../utils/MomentUtil');
const { getBalanceByRIndex, getBalanceMaxIndex, summaryBalance } = require('./CoreService');
const { mappingResultDataList } = require('../utils/ConvertThai');

const getTotalBalance = async (tableNo) => {
    const sql = `select sum(R_Total) R_Total from balance where R_Table='${tableNo}'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0].R_Total
    }
    return 0.00
}

const getSubProductByPluCode = async ({ tableNo, rLinkIndex }) => {
    const sql = `select * from balance where R_Table='${tableNo}' and R_LinkIndex='${rLinkIndex}'`;
    const results = await pool.query(sql)

    return mappingResultDataList(results)
}

const voidListMenuBalanceAll = async ({ menu_code, void_message, Cachier, empCode, macno }) => {
    const allMenuInBalance = await getAllBalanceByMenuCode(menu_code)
    allMenuInBalance.forEach(async item => {
        if(item.R_Void !== 'V'){
            await voidMenuBalance({
                R_Index: item.R_Index, 
                Cachier, 
                empCode, 
                voidMsg: void_message, 
                macno
            })
        }
    })
}

const voidMenuBalance = async ({ R_Index, Cachier, empCode, voidMsg, macno }) => {
    // Update  Balance File For Void
    const balance = await getBalanceByRIndex(R_Index);
    if (balance && balance.R_Void !== 'V') {
        // process return stock
        await returnStockIn(balance.R_Index, balance, empCode, voidMsg, macno)

        let updBalance = `UPDATE balance 
                SET r_void='V',
                cashier='${Cachier}',
                r_emp='${empCode}',
                r_voiduser='${Cachier}',
                r_voidtime=curtime(),
                r_discbath='0',
                macno='${macno}',
                r_kicprint='',
                r_opt9='${Unicode2ASCII(voidMsg)}',
                voidmsg='${Unicode2ASCII(voidMsg)}' 
                WHERE r_index='${balance.R_Index}' and r_table='${balance.R_Table}'`;
        const results = await pool.query(updBalance)

        if (results.affectedRows > 0) {
            // summary table
            summaryBalance(balance.R_Table, macno)

            return `${R_Index} Updated.`
        }
    }
    return `Cannot void R_Index: ${R_Index}`
}

const getAllBalance = async () => {
    const sql = `select * from balance order by R_Table, R_Index`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getAllBalanceByMenuCode = async (menuCode) => {
    const sql = `select * from balance where R_PluCode='${menuCode}' order by R_Table, R_Index`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getAllBalanceByRLinkIndex = async (rLinkIndex) => {
    const sql = `select * from balance where R_LinkIndex='${rLinkIndex}' order by R_Index`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getBalanceByTableNo = async tableNo => {
    const sql = `select * from balance where R_Table='${tableNo}' order by R_Table, R_Index`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}
const getBalanceByTableNoSummary = async tableNo => {
    const sql = `select R_PluCode, R_PName, R_Void, 
        sum(R_Quan) R_Quan, 
        sum(R_Total) R_Total 
        from balance b 
        where b.R_Table ='${tableNo}' 
        and (R_LinkIndex ='' or R_LinkIndex is null or R_LinkIndex = 'null') 
        and R_Void != 'V' 
        group by R_Void, R_PluCode, R_PName 
        order by R_PluCode`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getBalanceGroupProduct = async tableNo => {
    const sql = `select R_ETD, R_PluCode, R_PName, 
        sum(R_Quan) R_Quan, 
        sum(R_Total) R_Total 
        from balance 
        where R_Table ='${tableNo}' 
        and R_LinkIndex='' 
        group by R_ETD, R_PluCode, R_PName`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getVoidMsgList = async () => {
    const sql = `select * from voidmsg order by VCode`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const emptyTableBalance = async tableNo => {
    const sql = `delete from balance where R_Table='${tableNo}'`;
    const results = await pool.query(sql)

    // clear temp cupon
    await pool.query(`delete from tempcupon where R_Table='${tableNo}'`)

    return results
}

const deleteBalanceOnly = async R_Index => {
    const sql = `delete from balance where R_Index='${R_Index}'`;
    const results = await pool.query(sql)
    return results
}

const updatePrint2Kic = async tableNo => {
    const sql = `update balance 
    set TranType='PDA', 
    R_Pause='P' 
    where R_Table='${tableNo}'`;
    const results = await pool.query(sql)
    return results
}

const updateBalanceQty = async (tableNo, rIndex, qty) => {
    if (qty === 0) {
        const sql = `delete from balance 
        where R_Table='${tableNo}' 
        and R_Index='${rIndex}' 
        and R_Pause <> 'P' `;
        const result = pool.query(sql)
        return result
    } else {
        const sql = `update balance set R_Quan=${qty} 
        where R_Table='${tableNo}' 
        and R_Index='${rIndex}' 
        and R_Pause <> 'P'`
        const result = await pool.query(sql)
        return result
    }
}

const addListBalance = async (payload) => {
    const { listBalance, tableNo, macno, userLogin, empCode, R_LinkIndex, etdType, qty } = payload
    const Main_Index = await getBalanceMaxIndex(tableNo)
    listBalance.forEach(async (product, index) => {
        const posProduct = await getProductByPCode(product.menu_code)
        const R_Index = Main_Index + "/" + PrefixZeroFormat(index + 1, 2)
        const reponseR_Index = await addNewBalance({
            tableNo,
            menuInfo: { ...product },
            qty,
            optList: [],
            specialText: "",
            macno,
            userLogin,
            empCode,
            R_Index: R_Index,
            R_LinkIndex,
            posProduct,
            R_ETD: etdType
        })

        // summary tablefile
        await summaryBalance(tableNo, macno)

        // process stock out
        await orderStockOut(reponseR_Index)
    });
}

const addBalance = async payload => {
    const { tableNo, menuInfo, qty, optList = [], specialText = "",
        macno, userLogin, empCode, etdType } = payload
    const R_Index = await getBalanceMaxIndex(tableNo)
    if (!R_Index) {
        throw new Error('Not found Max R_Index !!!')
    }
    const posProduct = await getProductByPCode(menuInfo.menu_code)
    if (!posProduct) {
        throw new Error('Not found product !!!')
    }
    const reponseR_Index = await addNewBalance({
        tableNo,
        menuInfo,
        qty,
        optList,
        specialText,
        macno,
        userLogin,
        empCode,
        R_Index,
        R_LinkIndex: "",
        posProduct,
        R_ETD: etdType
    })

    // summary tablefile
    await summaryBalance(tableNo, macno)

    // process stock out
    await orderStockOut(reponseR_Index)

    return reponseR_Index
}

const mappingOpt = (optList, specialText) => {
    const R_Opt = [...optList, specialText]
    const arrSize = R_Opt.length
    for (let i = arrSize; i < 9; i++) {
        R_Opt[i] = ""
    }

    return R_Opt
}

const addNewBalance = async payload => {
    const { tableNo, menuInfo, qty, optList = [], specialText = "",
        macno, userLogin, empCode, R_Index, R_LinkIndex = "", posProduct, R_ETD = 'E' } = payload
    const R_Table = tableNo
    const R_PluCode = menuInfo.menu_code
    const R_PName = Unicode2ASCII(menuInfo.menu_name)
    const R_Quan = qty
    const R_Price = menuInfo.menu_price
    const R_Total = menuInfo.menu_price * qty
    const R_PrBath = 0
    const R_PrAmt = 0
    const R_DiscBath = 0
    const R_PrCuQuan = 0
    const R_PrCuAmt = 0
    const R_Redule = 0
    const R_Serve = ""
    const R_PrintOK = "Y"
    const R_KicOK = ""
    const StkCode = "A1"
    const PosStk = posProduct.POSStk
    const R_Order = posProduct.POrder
    const R_PItemNo = 0
    const R_PKicQue = 0
    const R_MemSum = "N"
    const R_PrVcAmt = 0
    const R_PrVcAdj = 0
    const R_VoidQuan = 0
    const R_MoveFlag = ""
    const R_MovePrint = "N"
    const R_Pause = ""
    const R_SPIndex = ""
    const R_Earn = ""
    const Macno = macno
    const Cashier = userLogin
    const R_Emp = empCode
    const TranType = ""
    const R_KicPrint = ""
    const R_Void = ""
    const R_Kic = posProduct.PKic
    const R_Type = posProduct.PType

    const R_Date = getMoment().format('YYYY-MM-DD')
    const R_Time = getMoment().format('HH:mm:ss');
    const R_Unit = Unicode2ASCII(posProduct.PUnit1);
    const R_Group = posProduct.PGroup;
    const R_Status = posProduct.PStatus;
    const R_Normal = posProduct.PNormal;
    const R_Discount = posProduct.PDiscount;
    const R_Service = posProduct.PService;
    const R_Stock = posProduct.PStock;
    const R_Set = posProduct.PSet;
    const R_Vat = posProduct.PVat;
    const R_PrType = "";
    const R_PrCode = "";
    const R_PrDisc = 0;
    const R_PrCuType = "";
    const R_VoidUser = "";
    const R_VoidTime = "";
    const FieldName = 0;

    const R_Opt = mappingOpt(optList, specialText)

    const R_Opt1 = Unicode2ASCII(R_Opt[0]);
    const R_Opt2 = Unicode2ASCII(R_Opt[1]);
    const R_Opt3 = Unicode2ASCII(R_Opt[2]);
    const R_Opt4 = Unicode2ASCII(R_Opt[3]);
    const R_Opt5 = Unicode2ASCII(R_Opt[4]);
    const R_Opt6 = Unicode2ASCII(R_Opt[5]);
    const R_Opt7 = Unicode2ASCII(R_Opt[6]);
    const R_Opt8 = Unicode2ASCII(R_Opt[7]);
    const R_Opt9 = Unicode2ASCII(R_Opt[8]);

    const R_PrCuCode = "";
    const R_PrChkType = "";
    const R_PrQuan = 0;
    const R_PrSubType = "";
    const R_PrSubCode = "";
    const R_PrSubQuan = 0;
    const R_PrSubDisc = 0;
    const R_PrSubBath = 0;
    const R_PrSubAmt = 0;
    const R_PrSubAdj = 0;
    const R_PrCuDisc = 0;
    const R_PrCuBath = 0;
    const R_PrCuAdj = 0;
    const R_QuanCanDisc = 1;
    const R_PrVcType = "";
    const R_PrVcCode = "";
    const R_VoidPause = "";
    const R_MoveItem = "N";
    const R_MoveFrom = "";
    const R_MoveUser = "";
    const VoidMsg = "";
    const R_PrintItemBill = "";
    const R_CountTime = "";
    const SoneCode = "";
    const R_EarnNo = "";
    const PDAPrintCheck = "";
    const PDAEMP = "";
    const R_empName = "";
    const R_ServiceAmt = 0;
    const R_PEName = "";
    const R_Indulgent = "";

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
        VALUES ('${R_Index}','${R_Table}','${R_Date}','${R_Time}','${Macno}','${Cashier}','${R_Emp}','${R_PluCode}','${R_PName}',
        '${R_Unit}','${R_Group}','${R_Status}','${R_Normal}','${R_Discount}','${R_Service}','${R_Stock}','${R_Set}','${R_Vat}',
        '${R_Type}','${R_ETD}','${R_Quan}','${R_Price}','${R_Total}','${R_PrType}','${R_PrCode}','${R_PrDisc}','${R_PrBath}',
        '${R_PrAmt}','${R_DiscBath}','${R_PrCuType}','${R_PrCuQuan}','${R_PrCuAmt}','${R_Redule}','${R_Kic}','${R_KicPrint}',
        '${R_Void}','${R_VoidUser}','${R_VoidTime}','${FieldName}','${R_Opt1}','${R_Opt2}','${R_Opt3}','${R_Opt4}','${R_Opt5}',
        '${R_Opt6}','${R_Opt7}','${R_Opt8}','${R_Opt9}','${R_PrCuCode}','${R_Serve}','${R_PrintOK}','${R_KicOK}','${StkCode}',
        '${PosStk}','${R_PrChkType}','${R_PrQuan}','${R_PrSubType}','${R_PrSubCode}','${R_PrSubQuan}','${R_PrSubDisc}','${R_PrSubBath}',
        '${R_PrSubAmt}','${R_PrSubAdj}','${R_PrCuDisc}','${R_PrCuBath}','${R_PrCuAdj}','${R_QuanCanDisc}','${R_Order}','${R_PItemNo}',
        '${R_PKicQue}','${R_MemSum}','${R_PrVcType}','${R_PrVcCode}','${R_PrVcAmt}','${R_PrVcAdj}','${R_VoidQuan}','${R_MoveFlag}',
        '${R_MovePrint}','${R_Pause}','${R_SPIndex}','${R_LinkIndex}','${R_VoidPause}','${R_MoveItem}','${R_MoveFrom}','${R_MoveUser}',
        '${VoidMsg}','${R_PrintItemBill}','${R_CountTime}','${SoneCode}','${R_Earn}','${R_EarnNo}','${TranType}',
        '${PDAPrintCheck}','${PDAEMP}','${R_empName}','${R_ServiceAmt}','${R_PEName}','${R_Indulgent}')`
    await pool.query(sql)
    return R_Index
}

const updateChangeTypeMenu = async (R_Table, R_ETD, macno, R_Index) => {
    // update main menu
    await pool.query(`update balance set R_ETD='${R_ETD}' where R_Index='${R_Index}'`)

    // check subMenuList
    const subLinkIndex = await getAllBalanceByRLinkIndex(R_Index)
    subLinkIndex.forEach(async item => {
        await pool.query(`update balance set R_ETD='${R_ETD}' where R_Index='${item.R_Index}'`)
    })

    // summary table
    summaryBalance(R_Table, macno)
}

const updateBalanceDetail = async payload => {
    const { oldBalance, discount, optList = [], specialText = "", macno, userLogin, empCode, R_ETD } = payload
    const { R_Index, R_Table, R_PluCode, R_PName, R_Unit, R_Group, R_Status, R_Normal, R_Discount,
        R_Service, R_Stock, R_Set, R_Vat, R_Type, R_Price, R_PrType, R_PrCode,
        R_DiscBath, R_PrCuType, R_PrCuQuan, R_PrCuAmt, R_Redule, R_Kic,
        R_KicPrint, R_Void, R_VoidUser, R_VoidTime, FieldName, R_PrCuCode, R_Serve, R_PrintOK, R_KicOK,
        StkCode, PosStk, R_PrChkType, R_PrQuan, R_PrSubType, R_PrSubCode, R_PrSubQuan, R_PrSubDisc,
        R_PrSubBath, R_PrSubAmt, R_PrSubAdj, R_PrCuDisc, R_PrCuBath, R_PrCuAdj, R_Order,
        R_PItemNo, R_PKicQue, R_MemSum, R_PrVcType="", R_PrVcCode, R_PrVcAmt, R_PrVcAdj, R_VoidQuan,
        R_MoveFlag, R_MovePrint, R_Pause, R_SPIndex, R_LinkIndex, R_VoidPause, R_MoveItem, R_MoveFrom,
        R_MoveUser, VoidMsg, R_PrintItemBill, R_CountTime, SoneCode, R_Earn, R_EarnNo, TranType,
        PDAPrintCheck, PDAEMP, R_empName, R_ServiceAmt, R_PEName, R_Indulgent, R_Quan, R_QuanCanDisc } = oldBalance

    const R_Opt = mappingOpt(optList, specialText)

    const R_Opt1 = Unicode2ASCII(R_Opt[0]);
    const R_Opt2 = Unicode2ASCII(R_Opt[1]);
    const R_Opt3 = Unicode2ASCII(R_Opt[2]);
    const R_Opt4 = Unicode2ASCII(R_Opt[3]);
    const R_Opt5 = Unicode2ASCII(R_Opt[4]);
    const R_Opt6 = Unicode2ASCII(R_Opt[5]);
    const R_Opt7 = Unicode2ASCII(R_Opt[6]);
    const R_Opt8 = Unicode2ASCII(R_Opt[7]);
    const R_Opt9 = Unicode2ASCII(R_Opt[8]);

    const GetVoidMsg = Unicode2ASCII(VoidMsg)

    const R_Date = getMoment().format('YYYY-MM-DD');
    const R_Time = getMoment().format('HH:mm:ss');
    const Macno = macno;
    const Cashier = userLogin;
    const R_Emp = empCode;

    let newRTotal = R_Price * R_Quan

    let RPrDisc = 0
    let RPrBath = 0

    // for discount
    let RPrType = R_PrType || ''
    let newDiscountBaht = 0
    let RQuanCanDisc = R_QuanCanDisc
    let RPrQuan = R_PrQuan
    if (R_Discount === 'Y') {
        if (discount.discountPercent > 0) {
            RPrDisc = discount.discountPercent
            newDiscountBaht = newRTotal * parseFloat(discount.discountPercent) / 100
        } else if(discount.discountBaht > 0) {
            newDiscountBaht = discount.discountBaht
        }

        if(newDiscountBaht>0){
            RPrType = '-I'
            RQuanCanDisc = RQuanCanDisc - R_Quan
            RPrQuan = RPrQuan + R_Quan
        }else{
            RPrType = ''
        }
    }

    const sql = `UPDATE balance 
        SET R_Index='${R_Index}',R_Table='${R_Table}',R_Date='${R_Date}',R_Time='${R_Time}',
        Macno='${Macno}',Cashier='${Cashier}',R_Emp='${R_Emp}',R_PluCode='${R_PluCode}',
        R_PName='${R_PName}',R_Unit='${R_Unit}',R_Group='${R_Group}',R_Status='${R_Status}',
        R_Normal='${R_Normal}',R_Discount='${R_Discount}',R_Service='${R_Service}',R_Stock='${R_Stock}',
        R_Set='${R_Set}',R_Vat='${R_Vat}',R_Type='${R_Type}',R_ETD='${R_ETD}',R_Quan='${R_Quan}',
        R_Price='${R_Price}',R_Total='${newRTotal}',R_PrType='${RPrType}',R_PrCode='${R_PrCode}',
        R_PrDisc='${RPrDisc}',R_PrBath='${RPrBath}',R_PrAmt='${newDiscountBaht}',R_DiscBath='${R_DiscBath}',
        R_PrCuType='${R_PrCuType}',R_PrCuQuan='${R_PrCuQuan}',R_PrCuAmt='${R_PrCuAmt}',
        R_Redule='${R_Redule}',R_Kic='${R_Kic}',R_KicPrint='${R_KicPrint}',R_Void='${R_Void}',
        R_VoidUser='${R_VoidUser}',R_VoidTime='${R_VoidTime}',FieldName='${FieldName}',
        R_Opt1='${R_Opt1}',R_Opt2='${R_Opt2}',R_Opt3='${R_Opt3}',R_Opt4='${R_Opt4}',R_Opt5='${R_Opt5}',
        R_Opt6='${R_Opt6}',R_Opt7='${R_Opt7}',R_Opt8='${R_Opt8}',R_Opt9='${R_Opt9}',
        R_PrCuCode='${R_PrCuCode}',R_Serve='${R_Serve}',R_PrintOK='${R_PrintOK}',R_KicOK='${R_KicOK}',
        StkCode='${StkCode}',PosStk='${PosStk}',R_PrChkType='${R_PrChkType}',R_PrQuan='${RPrQuan}',
        R_PrSubType='${R_PrSubType}',R_PrSubCode='${R_PrSubCode}',R_PrSubQuan='${R_PrSubQuan}',
        R_PrSubDisc='${R_PrSubDisc}',R_PrSubBath='${R_PrSubBath}',R_PrSubAmt='${R_PrSubAmt}',
        R_PrSubAdj='${R_PrSubAdj}',R_PrCuDisc='${R_PrCuDisc}',R_PrCuBath='${R_PrCuBath}',
        R_PrCuAdj='${R_PrCuAdj}',R_QuanCanDisc='${RQuanCanDisc}',R_Order='${R_Order}',
        R_PItemNo='${R_PItemNo}',R_PKicQue='${R_PKicQue}',R_MemSum='${R_MemSum}',R_PrVcType='${R_PrVcType}',
        R_PrVcCode='${R_PrVcCode}',R_PrVcAmt='${R_PrVcAmt}',R_PrVcAdj='${R_PrVcAdj}',
        R_VoidQuan='${R_VoidQuan}',R_MoveFlag='${R_MoveFlag}',R_MovePrint='${R_MovePrint}',
        R_Pause='${R_Pause}',R_SPIndex='${R_SPIndex}',R_LinkIndex='${R_LinkIndex}',
        R_VoidPause='${R_VoidPause}',R_MoveItem='${R_MoveItem}',R_MoveFrom='${R_MoveFrom}',
        R_MoveUser='${R_MoveUser}',VoidMsg='${GetVoidMsg}',R_PrintItemBill='${R_PrintItemBill}',
        R_CountTime='${R_CountTime}',SoneCode='${SoneCode}',R_Earn='${R_Earn}',R_EarnNo='${R_EarnNo}',
        TranType='${TranType}',PDAPrintCheck='${PDAPrintCheck}',PDAEMP='${PDAEMP}',R_empName='${R_empName}',
        R_ServiceAmt='${R_ServiceAmt}',R_PEName='${R_PEName}',R_Indulgent='${R_Indulgent}' 
        WHERE R_Index='${R_Index}'`
    await pool.query(sql)

    // summary table
    summaryBalance(R_Table, macno)

    return R_Index
}

const inventoryStock = async ({ R_Stock, R_Table, R_PluCode, R_Quan, R_Total, Cashier, R_Set, R_Index }) => {
    // update stock and process stockcard and stkfile
    const S_No = R_Table + "-" + getMoment().format('HH:mm:ss')
    
    if (R_Stock === 'Y') {
        const S_SubNo = ""
        const S_Que = 0
        const S_PCode = R_PluCode
        const S_In = 0
        const S_Out = R_Quan
        const S_InCost = 0
        const S_OutCost = R_Total
        const S_ACost = 0
        const S_Rem = "SAL"
        const S_User = Cashier
        const S_Link = ""

        const PStock = R_Stock
        const PSet = R_Set
        const r_index = R_Index
        const SaleOrRefund = "SALE" // SALE or REFUND

        await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out,
            S_InCost, S_OutCost, S_ACost, S_Rem, S_User, S_Link,
            PStock, PSet, r_index, SaleOrRefund)
    }

    // ตัดสต็อกสินค้าที่มี Ingredent
    await processAllPIngredent(S_No, R_PluCode, R_Quan, Cashier)

    // ตัดสต็อกสินค้าที่เป็นชุด SET (PSET)
    await processAllPSet(S_No, R_PluCode, R_Quan, Cashier)

    return S_No

}

const inventoryReturnStock = async ({ R_Stock, R_Table, R_PluCode, R_Quan, R_Total, Cashier, R_Set, R_Index, empCode, voidMsg, macno }) => {
    // update stock and process stockcard and stkfile
    if (R_Stock === 'Y') {
        const S_No = R_Table + "-" + getMoment().format('HH:mm:ss')
        const S_SubNo = ""
        const S_Que = 0
        const S_PCode = R_PluCode
        const S_In = R_Quan
        const S_Out = 0
        const S_InCost = R_Total
        const S_OutCost = 0
        const S_ACost = 0
        const S_Rem = "SAL"
        const S_User = Cashier
        const S_Link = ""

        const PStock = R_Stock
        const PSet = R_Set
        const r_index = R_Index
        const SaleOrRefund = "VOID" // SALE or REFUND

        await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out,
            S_InCost, S_OutCost, S_ACost, S_Rem, S_User, S_Link,
            PStock, PSet, r_index, SaleOrRefund)

        // ตัดสต็อกสินค้าที่มี Ingredent
        await processAllPIngredentReturnStock(S_No, R_PluCode, R_Quan, Cashier)

        // ตัดสต็อกสินค้าที่เป็นชุด SET (PSET)
        await processAllPSetReturn(R_PluCode, R_Quan, Cashier)
    }

    // ตัดสต็อกสินค้าที่เป็นกลุ่มสินค้า Category Set เนื่องจากตอน void สินค้าสามารถ void ได้แค่ตัวหลัก
    await processAllGroupSetReturn(R_Index, R_Table, R_Quan, Cashier, empCode, voidMsg, macno)
}

const orderStockOut = async (R_Index) => {
    const balance = await getBalanceByRIndex(R_Index)

    // process stock into inventory
    if (balance) {
        const response = await inventoryStock(
            {
                R_Stock: balance.R_Stock,
                R_Table: balance.R_Table,
                R_PluCode: balance.R_PluCode,
                R_Quan: balance.R_Quan,
                R_Total: balance.R_Total,
                Cashier: balance.Cashier,
                R_Set: balance.R_Set,
                R_Index
            })
        return response
    } else {
        return null
    }
}

const returnStockIn = async (R_Index, balance, empCode, voidMsg, macno) => {
    if (balance) {
        // process stock into inventory
        const response = await inventoryReturnStock(
            {
                R_Stock: balance.R_Stock,
                R_Table: balance.R_Table,
                R_PluCode: balance.R_PluCode,
                R_Quan: balance.R_Quan,
                R_Total: balance.R_Total,
                Cashier: balance.Cashier,
                R_Set: balance.R_Set,
                R_Index,
                empCode, voidMsg, macno
            })
        return response
    } else {
        return null
    }
}

module.exports = {
    getAllBalance,
    emptyTableBalance,
    updatePrint2Kic,
    getBalanceMaxIndex,
    addNewBalance,
    updateBalanceQty,
    getTotalBalance,
    addListBalance,
    addBalance,
    voidMenuBalance,
    updateBalanceDetail,
    inventoryStock,
    getBalanceByTableNo,
    orderStockOut,
    returnStockIn,
    getVoidMsgList,
    deleteBalanceOnly,
    getBalanceGroupProduct,
    voidListMenuBalanceAll,
    getSubProductByPluCode,
    updateChangeTypeMenu,
    getBalanceByTableNoSummary
}
