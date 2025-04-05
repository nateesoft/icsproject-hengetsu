const pool = require('../config/database/MySqlConnect')

const { getProductByPCode, getProductActiveByPCode } = require('./ProductService');
const { getBalanceByRIndex } = require('./CoreService');
const { getMoment } = require('../utils/MomentUtil');

const curdate = getMoment().format('YYYY-MM-DD')
const curtime = getMoment().format('HH:mm:ss')

const getSTCard = async () => {
    const sql = `select * from stcard`;
    const results = await pool.query(sql)
    return results
}

const getSTCardBySPCode = async (S_PCode) => {
    const sql = `select * from stcard where S_PCode='${S_PCode}'`;
    const results = await pool.query(sql)
    return results
}

const SeekStkFile = async (TempCode, T_Stk) => {
    const sql = `select bpcode from stkfile 
    where (bpcode='${TempCode}') and (bstk='${T_Stk}') limit 1 `;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const getPSetByPCode = async (TempCode) => {
    const sql = `select * from pset where pcode='${TempCode}'`;
    const results = await pool.query(sql)
    return results
}

const getBalanceSetByPCodeRIndex = async (XCode, R_Index) => {
    const sql = `select * from balanceset 
    where r_plucode='${XCode}' and r_index='${R_Index}' `;
    const results = await pool.query(sql)
    return results
}

const getTSaleSet = async (XCode, r_index, XDocNo) => {
    const sql = `select * from t_saleset 
    where r_plucode='${XCode}' 
    and r_index='${r_index}'  and r_refno='${XDocNo}' `;
    const results = await pool.query(sql)
    return results
}

const getCompany = async () => {
    const sql = `select * from company limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return getMoment().format('YYYY-MM-DD')
}

const GetActionMon = async () => {
    const Company = await getCompany()
    let TempYear = Company.Accterm ? getMoment(Company.Accterm).format("YYYY") : getMoment().format("YYYY")
    let CurYear = getMoment().format('YYYY')
    let CurMonth = getMoment().format('MM')

    let responseMonth = 0
    if (TempYear === CurYear) {
        responseMonth = parseInt(CurMonth) + 12
    } else {
        if (parseInt(CurYear) === parseInt(TempYear) - 1) {
            responseMonth = parseInt(CurMonth)
        } else {
            responseMonth = 0
        }
    }
    return responseMonth
}

const ProcessSetUpdateStockOut = async (DocNo, StkCode, XCode, StkRemark, XQty, UserPost) => {
    let psetList = await getPSetByPCode(XCode);
    psetList.forEach(async psetBean => {
        let TempQty = psetBean.PSubQty * XQty;

        let productBean = await getProductByPCode(psetBean.PSubCode);
        let TempAmt = productBean.PPrice11 * XQty;

        if (productBean.PStock === "Y") {
            let sql = `insert into stcard 
                (s_date,s_no,s_stk,s_pcode,s_que,s_in,s_incost,
                s_out,s_outcost,s_rem,s_user,s_entrydate,s_entrytime) 
                values ('${curdate}',?,?,?,?,?,?,?,?,?,?,'${curdate}','${curtime}')`;
            const s_no = DocNo + "@" + XCode;
            const s_stk = StkCode;
            const s_pcode = psetBean.PSubCode;
            const s_que = 1;
            const s_in = 0;
            const s_incost = 0
            const s_out = TempQty
            const s_outcost = TempAmt
            const s_rem = StkRemark
            const s_user = UserPost
            await pool.query(sql, [
                s_no, s_stk, s_pcode, s_que, s_in, s_incost,
                s_out, s_outcost, s_rem, s_user
            ])

            let TempAct = await GetActionMon();
            let resultSeekStkFile = await SeekStkFile(psetBean.PSubCode, StkCode)
            if (!resultSeekStkFile) {
                let sql = "insert into stkfile (bpcode,bstk) values (?,?)"
                await pool.query(sql, [psetBean.PSubCode, StkCode])
            }

            let sqlUpd = `update stkfile set bqty?=bqty?-? where (bpcode=?) and (bstk=?)`;
            for (let i = TempAct; i <= 24; i++) {
                await pool.query(sqlUpd, [i, i, TempQty, psetBean.PSubCode, StkCode])
            }
        }
    })
}

const ProcessSelectSetUpdateStockOut = async (DocNo, StkCode, XCode, StkRemark, XQty, UserPost, r_index) => {
    let listBalanceSet = await getBalanceSetByPCodeRIndex(XCode, r_index);
    listBalanceSet.forEach(async balance => {
        let TempCode = balance.R_PSubcode
        let TempQty = balance.R_SetQty * XQty;

        let proBean = await getProductByPCode(TempCode);
        let TempAmt = proBean.PPrice11 * XQty;

        if (proBean.PStock === "Y") {
            let InsertQuery = `insert into stcard (s_date,s_no,s_stk,s_pcode,s_que,s_in,s_incost,
                s_out,s_outcost,s_rem,s_user,s_entrydate,s_entrytime) 
                values ('${curdate}',?,?,?,?,?,?,?,?,?,?,'${curdate}','${curtime}')`;
            const s_no = DocNo + "@" + XCode
            const s_stk = StkCode
            const s_pcode = TempCode
            const s_que = 1
            const s_in = 0
            const s_incost = 0
            const s_out = TempQty
            const s_outcost = TempAmt
            const s_rem = StkRemark
            const s_user = UserPost //User
            await pool.query(InsertQuery,
                [s_no, s_stk, s_pcode, s_que, s_in, s_incost, s_out, s_outcost, s_rem, s_user])

            let TempAct = await GetActionMon();
            let resultSeekStkFile = await SeekStkFile(TempCode, StkCode)
            if (!resultSeekStkFile) {
                let sqlInsert = "insert into stkfile (bpcode,bstk) values (?,?)";
                await pool.query(sqlInsert, [TempCode, StkCode])

                let sqlUpdate = "update stkfile set bqty?=bqty?-? where (bpcode=?) and (bstk=?)";
                for (let i = TempAct; i <= 24; i++) {
                    await pool.query(sqlUpdate, [i, i, TempQty, TempCode, StkCode])
                }
            }
        }
    })
}

const ProcessSelectSetUpdateStockOutRefund = async (DocNo, StkCode, XCode, StkRemark, XQty, UserPost, r_index) => {
    let XDocNo = DocNo.substring(1, 8)

    let TSaleSetList = await getTSaleSet(XCode, r_index, XDocNo)
    TSaleSetList.forEach(async data => {
        let TempCode = data.r_psubcode
        let TempQty = data.r_setqty * XQty;
        let T_Rem = StkRemark;
        let StkProc = false;

        let productBean = await getProductByPCode(TempCode);
        let TempAmt = productBean.pprice11 * XQty

        if (productBean.pstock === "Y") {
            let InsertQuery = `insert into stcard 
                (s_date,s_no,s_stk,s_pcode,s_que,s_in,s_incost,s_out,s_outcost,s_rem,
                s_user,s_entrydate,s_entrytime) 
                values ('${curdate}',?,?,?,?,?,?,?,?,?,?,'${curdate}','${curtime}')`;
            const s_no = DocNo + "@" + XCode
            const s_stk = StkCode
            const s_pcode = TempCode
            const s_que = 1
            const s_in = 0
            const s_incost = 0
            const s_out = TempQty
            const s_outcost = TempAmt
            const s_rem = T_Rem
            const s_user = UserPost //User
            await pool.query(InsertQuery, [s_no, s_stk, s_pcode, s_que, s_in, s_incost, s_out, s_outcost, s_rem, s_user])

            let TempAct = await GetActionMon();
            let resultSeekStkFile = await SeekStkFile(TempCode, StkCode)
            if (!resultSeekStkFile) {
                let InsertQuery4 = `insert into stkfile (bpcode,bstk) values (?,?)`
                await pool.query(InsertQuery4, [TempCode, StkCode])
            }
            for (let i = TempAct; i <= 24; i++) {
                let T_Mon = "bqty" + i;
                let InsertQuery4 = `update stkfile set ${T_Mon}=${T_Mon}-? where (bpcode=?) and (bstk=?)`
                await pool.query(InsertQuery4, [TempQty, TempCode, StkCode])
            }
        }
    })
}

const ProcessStockOut = async (S_No, S_SubNo, S_Que, S_PCode, S_In, S_Out, S_InCost, S_OutCost, S_ACost, S_Rem, S_User, S_Link, PStock, PSet, r_index, SaleOrRefund) => {
    const S_Date = getMoment().format('YYYY-MM-DD')
    const S_Stk = "A1"
    const S_EntryDate = getMoment().format('YYYY-MM-DD')
    const S_EntryTime = getMoment().format('HH:mm');

    // remove from stock
    let sql = `INSERT INTO stcard 
    (S_Date,S_No,S_SubNo,S_Que,S_PCode,S_Stk,S_In,S_Out,S_InCost,S_OutCost,
    S_ACost,S_Rem,S_User,S_EntryDate,S_EntryTime,S_Link) 
    VALUES ('${S_Date}','${S_No}','${S_SubNo}','${S_Que}','${S_PCode}',
    '${S_Stk}','${S_In}','${S_Out}',
    '${S_InCost}','${S_OutCost}','${S_ACost}','${S_Rem}','${S_User}',
    '${S_EntryDate}','${S_EntryTime}','${S_Link}')`
    await pool.query(sql)

    let TempAct = await GetActionMon()
    let resultSeekStkFile = await SeekStkFile(S_PCode, S_Stk)
    if (!resultSeekStkFile) {
        let sql1 = `insert into stkfile (bpcode,bstk) values (?,?)`
        await pool.query(sql1, [S_PCode, S_Stk])
    }

    const qtyAdjust = SaleOrRefund === "SALE" ? S_Out : (S_In * -1)
    for (let i = TempAct; i <= 24; i++) {
        let T_Mon = "bqty" + i;
        let sql1 = `update stkfile set ${T_Mon}=${T_Mon}-? where (bpcode=?) and (bstk=?)`
        await pool.query(sql1, [qtyAdjust, S_PCode, S_Stk])
    }

    // check pset or not
    if (PSet === 'Y') {
        let productBean = await getProductActiveByPCode(S_PCode)
        if (!productBean) {
            await ProcessSetUpdateStockOut(S_No, S_Stk, S_PCode, S_Rem, S_Out, S_User)
        } else {
            if (SaleOrRefund === "SALE") {
                await ProcessSelectSetUpdateStockOut(S_No, S_Stk, S_PCode, S_Rem, S_Out, S_User, r_index);
            } else if (SaleOrRefund === "REFUND" || SaleOrRefund === "VOID") {
                await ProcessSelectSetUpdateStockOutRefund(S_No, S_Stk, S_PCode, S_Rem, S_Out, S_User, r_index);
            }
        }
    }
}

const executeProcess = async (R_Index) => {
    const balance = await getBalanceByRIndex(R_Index)
    const S_No = balance.R_Table + "-" + getMoment().format('HH:mm:ss')
    const S_SubNo = ""
    const S_Que = 0
    const S_PCode = balance.R_PluCode
    const S_Stk = "A1"
    const S_In = 0
    const S_Out = balance.R_Quan
    const S_InCost = 0
    const S_OutCost = balance.R_Total
    const S_ACost = 0
    const S_Rem = "SAL"
    const S_User = balance.Cashier
    const S_Link = ""

    const PStock = balance.R_Stock
    const PSet = balance.R_Set
    const r_index = balance.R_Index
    const SaleOrRefund = "SALE" // SALE or REFUND

    await ProcessStockOut(S_No, S_SubNo, S_Que, S_PCode, S_Stk, S_In, S_Out,
        S_InCost, S_OutCost, S_ACost, S_Rem, S_User, S_Link,
        PStock, PSet, r_index, SaleOrRefund)

}

module.exports = {
    ProcessStockOut,
    executeProcess,
    getSTCard,
    getSTCardBySPCode
}
