const pool = require('../../../config/database/MyCrmDB')
const { ASCII2Unicode, Unicode2ASCII } = require('../../../utils/StringUtil');
const { createMtran } = require('./MTranService');
const { createMPlu } = require('./MPluService');
const { getDataBranchPoint } = require('./PointTypeService');
const { getMoment, getYesterday } = require('../../../utils/MomentUtil')

const getData = async () => {
    const sql = `select * from memmaster order by Member_Code limit 0, 50`;
    const results = await pool.query(sql)
    const mappingResult = results.map((item, index) => {
        return { ...item, Member_NameThai: ASCII2Unicode(item.Member_NameThai) }
    })

    return mappingResult
}

const getMemberByCode = async (memberCode) => {
    const sql = `select * from memmaster 
    where Member_Code='${memberCode}' order by Member_Code limit 0, 50`;
    const results = await pool.query(sql)
    return results
}

const searchData = async (phone, code, name) => {
    let sql = `select * from memmaster `;
    if (phone && phone !== '') {
        sql = sql + ` where  replace(Member_Mobile, '-', '') = '${phone.replace('-', '')}' limit 0, 100`
    } else if (code && code !== '') {
        sql = sql + ` where Member_Code = '${code}' limit 0, 100`
    } else if (name && name !== '') {
        sql = sql + ` where 
        (Member_NameThai = '%${Unicode2ASCII(name)}%' 
        or Member_NameThai like '%${name}%' 
        or Member_NameEng like '%${name}%') 
        limit 0, 100`
    } else {
        sql = sql + ` limit 0,0`
    }
    const results = await pool.query(sql)
    const mappingResult = results.map((item, index) => {
        return { ...item, Member_NameThai: ASCII2Unicode(item.Member_NameThai) }
    })

    return mappingResult
}

const getDataByMemberCode = async (Member_Code) => {
    const sql = `select * from memmaster where Member_Code='${Member_Code}'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return { ...results[0], Member_NameThai: ASCII2Unicode(results[0].Member_NameThai) }
    }
    return null
}

const updateRefundMember = async (billData) => {
    let sql = `update memmaster 
        set Member_TotalPurchase=Member_TotalPurchase-${billData.B_NetTotal} ,
        Member_TotalScore=Member_TotalScore-${billData.B_MemCurSum} 
        where (Member_Code='${billData.B_MemCode}')`
    const results = await pool.query(sql)

    // empty mplu
    let receiptNo = `${billData.B_MacNo}/${billData.B_Refno}`;
    await pool.query(`delete from mplu where Receipt_No='${receiptNo}'`)
    await pool.query(`delete from mtran where Receipt_No='${receiptNo}'`)

    return results
}

const generateSaleType = etd => {
    if ("E" == etd) return 1;
    if ("T" == etd) return 2;
    if ("D" == etd) return 3;
    return ""
}

const checkDateExpired = (startDateStr, endDateStr) => {
    if(!endDateStr){
        return true
    }
    const currentDate = getMoment()

    const startDate = getMoment(startDateStr)
    const endDate = getMoment(endDateStr)

    return currentDate.isBetween(startDate, endDate);
}
const checkTimeExpired = (startDateTimeStr, endDateTimeStr) => {
    const currentDateTime = getMoment().format('YYYY-MM-DD HH:mm:ss')

    const startDateTime = getMoment().format('YYYY-MM-DD') + ' ' + startDateTimeStr
    const endDateTime = getMoment().format('YYYY-MM-DD') + ' ' + endDateTimeStr

    return getMoment(currentDateTime).isBetween(getMoment(startDateTime), getMoment(endDateTime))
}

const computeMemberScore = async (B_NetTotal, Member_PointExpiredDate) => {
    // check member expired
    const isMemberExpired = checkDateExpired(getYesterday().format('YYYY-MM-DD HH:mm:ss'), Member_PointExpiredDate)
    if (!isMemberExpired) {
        return 0
    }

    const pointType = await getDataBranchPoint()
    let pointTotal = 0

    if (!pointType) {
        return 0
    }

    // check time active
    const isTimeActive1 = checkTimeExpired(pointType.Point_StartTimeService1, pointType.Point_FinishTimeService1)
    const isTimeActive2 = checkTimeExpired(pointType.Point_StartTimeService2, pointType.Point_FinishTimeService2)
    const isTimeActive3 = checkTimeExpired(pointType.Point_StartTimeService3, pointType.Point_FinishTimeService3)

    if (isTimeActive1) {
        pointTotal = Math.floor(B_NetTotal / pointType.BahtRatePerPoint1 * pointType.point1)
    } else if (isTimeActive2) {
        pointTotal = Math.floor(B_NetTotal / pointType.BahtRatePerPoint2 * pointType.point2)
    } else if (isTimeActive3) {
        pointTotal = Math.floor(B_NetTotal / pointType.BahtRatePerPoint3 * pointType.point3)
    }

    return pointTotal
}

const updateMemberData = async (B_NetTotal, B_MemCode,
    B_MacNo, B_Refno, allBalance, branchCode, B_ETD,
    B_Total, B_ServiceAmt, B_MemDiscAmt, empCode, B_OnDate, B_Ontime, memberInfo) => {

    // create new mtran
    const Receipt_No = B_MacNo + "/" + B_Refno;
    const Member_Code = B_MemCode;
    const Branch_Code = branchCode || "";
    const Sale_Type = generateSaleType(B_ETD);
    const GrossAmount = B_Total + B_ServiceAmt;
    const DiscountAmount = B_MemDiscAmt;
    const NetAmount = B_NetTotal;
    const Mechine_Code = B_MacNo;
    const Employee_Code = empCode;
    const Service_Date = B_OnDate;
    const Service_Time = B_Ontime;
    const Score = await computeMemberScore(B_NetTotal, memberInfo.Member_PointExpiredDate);
    const TranferFlag = "N";

    await createMtran({
        Service_Date, Receipt_No, Member_Code, Branch_Code, Sale_Type, GrossAmount, DiscountAmount,
        NetAmount, Mechine_Code, Employee_Code, Service_Time, Score, TranferFlag
    })

    const sql = `update memmaster 
        set Member_TotalPurchase=Member_TotalPurchase+${B_NetTotal},
        Member_TotalScore=Member_TotalScore+${Score},
        Member_LastDateService='${Service_Date}' 
        where (Member_Code='${B_MemCode}')`
    const results = await pool.query(sql)

    // create new mplu
    allBalance.forEach(async balance => {
        const PLU_Group = balance.R_Group;
        const Sale_Type = balance.R_ETD;
        const PLU_GroupName = "";
        const PLU_Code = balance.R_PluCode;
        const PLU_Name = Unicode2ASCII(balance.R_PName);
        const PLU_Amount = balance.R_Total;
        const PLU_Quantity = balance.R_Quan;
        const PLU_Price = balance.R_Price;
        const TranferFlag = "N";
        await createMPlu({
            Service_Date,
            Member_Code, Branch_Code, Receipt_No, PLU_Group,
            Sale_Type, PLU_GroupName, PLU_Code, PLU_Name,
            PLU_Amount, PLU_Quantity, PLU_Price, TranferFlag
        })
    });

    return results
}

module.exports = {
    getData,
    getDataByMemberCode,
    searchData,
    updateRefundMember,
    updateMemberData
}
