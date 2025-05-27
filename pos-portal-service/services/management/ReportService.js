const pool = require('../../config/database')
const poolMember = require('../../config/database/MyCrmDB')
const { getMoment } = require('../../utils/MomentUtil');
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
        allMember: {
            data: await getAllMember()
        }
    }

    return overviewResponse
}

module.exports = {
    getOverviewReport
}
