const pool = require('../../config/database')
const poolMember = require('../../config/database/MyCrmDB')
const { getMoment } = require('../../utils/MomentUtil');
const { getBranch } = require('../BranchService');
const { getTopSaleList, getSaleByGroup, getSaleByType, getSaleByTime } = require('../ReportService');

const getCustomers = async () => {
    const sql = `select 
        sum(customer_count) customer_count,
        sum(thai_man_count) customer_man_count,
        sum(thai_woman_count) customer_woman_count,
        sum(thai_kid_count) customer_kid_count,
        sum(thai_old_count) customer_old_count 
        from table_checkin tc 
        where DATE_FORMAT(tc.datetime_checkin, '%Y-%m-%d') = '${getMoment().format('YYYY-MM-DD')}' `
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return {
        customer_count: 0,
        customer_man_count: 0,
        customer_woman_count: 0,
        customer_kid_count: 0,
        customer_old_count: 0
    }
}

const getAllMember = async () => {
    const branchInfo = await getBranch()
    const branch1 = branchInfo.Code
    const branch2 = branchInfo.Code
    const date1 = getMoment().startOf('month').format('YYYY-MM-DD')
    const date2 = getMoment().endOf('month').format('YYYY-MM-DD')

    const sql = `select 
      (SELECT count(*) FROM memmaster 
      WHERE member_branchcode BETWEEN '${branch1}' AND '${branch2}') all_member, 

      (SELECT count(*) FROM memmaster 
      WHERE member_branchcode BETWEEN '${branch1}' AND '${branch2}' 
      AND Member_AppliedDate BETWEEN '${date1}' AND '${date2}') new_register,

      (SELECT count(*) FROM memmaster 
      WHERE member_branchcode BETWEEN '${branch1}' AND '${branch2}' 
      AND Member_LastDateService BETWEEN '${date1}' AND '${date2}') first_check_in, 

      (SELECT count(*) FROM memmaster 
      WHERE member_branchcode BETWEEN '${branch1}' AND '${branch2}' 
      AND Member_LastDateService is null) not_come 
      from memmaster limit 1`
    const results = await poolMember.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return {
        all_member: 0,
        new_register: 0,
        customer_woman_count: 0,
        first_check_in: 0,
        not_come: 0
    }
}

const getOverviewReport = async () => {
    const overviewResponse = {
        customers: {
            data: await getCustomers()
        },
        topSales: {
            data: await getTopSaleList()
        },
        saleByGroup: {
            data: await getSaleByGroup()
        },
        saleByType: {
            data: await getSaleByType()
        },
        saleByTime: {
            data: await getSaleByTime()
        },
        member: {
            data: await getAllMember()
        }
    }

    return overviewResponse
}

module.exports = {
    getOverviewReport
}
