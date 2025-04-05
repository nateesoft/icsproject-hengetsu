const pool = require('../../config/database');
const mysqlPool = require('../../config/database/MySqlConnect');
const { Unicode2ASCII } = require('../../utils/StringUtil');

const { getMoment } = require('../../utils/MomentUtil');

const getTableInfo = async (tableNo) => {
    const sql = `select * from table_checkin where Tcode='${tableNo}' and active='Y'`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const getLastTableCheckIn = async (tableNo) => {
    const sql = `select * from table_checkin tc 
        where tc.Tcode='${tableNo}' 
        order by datetime_checkin 
        desc limit 1`;
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const updateTableCustomer = async (tableNo, customerCount) => {
    const sql = `update tablefile  set TCustomer='${customerCount}' where TCode='${tableNo}'`;
    const results = await mysqlPool.query(sql)
    return results
}

const updateInActiveTable = async (tableNo) => {
    const sql = `update table_checkin set active='N' where Tcode='${tableNo}'`;
    const results = await pool.query(sql)
    return results
}

const createData = async (tableNo, payload) => {
    const convCustName = Unicode2ASCII(payload.customer_name)
    const convNationCountry = Unicode2ASCII(payload.nation_country)
    const { empCode, macno,
        customer_count, 
        thai_man_count, thai_woman_count, thai_kid_count, thai_old_count,
        nation_man_count, nation_woman_count, nation_kid_count, nation_old_count,
        member_code, book_no, table_order_type_start = "E",
        customer_note, bill_no
     } = payload
    const emp_code_first = empCode;

    const tableInfo = await getTableInfo(tableNo) // check exists data
    if (tableInfo) {
        return updateData(tableNo, { ...payload, })
    }

    const dateTimeCheckin = getMoment().format('YYYY-MM-DD HH:mm:ss')

    const sql = `INSERT INTO table_checkin 
                (Tcode,emp_code_first,emp_code_last,macno,
                customer_count,
                thai_man_count, thai_woman_count, thai_kid_count, thai_old_count,
                datetime_checkin,customer_name,member_code,book_no,table_order_type_start,
                nation_man_count, nation_woman_count, nation_kid_count, nation_old_count,
                nation_country, customer_note, bill_no) 
                VALUES ('${tableNo}','${emp_code_first}','','${macno}',
                '${customer_count}','${thai_man_count}','${thai_woman_count}','${thai_kid_count}','${thai_old_count}',
                '${dateTimeCheckin}','${convCustName}','${member_code}','${book_no}','${table_order_type_start}',
                '${nation_man_count}', '${nation_woman_count}', '${nation_kid_count}', '${nation_old_count}',
                '${convNationCountry}', '${customer_note}', '${bill_no}')`;
    const results = await pool.query(sql)

    // update tablefile
    updateTableCustomer(tableNo, customer_count)

    return results
}

const updateData = async (tableNo, payload) => {
    const { empCode, macno,
        customer_count, 
        thai_man_count, thai_woman_count, thai_kid_count, thai_old_count,
        member_code, book_no, table_order_type_start = "E",
        nation_man_count, nation_woman_count, nation_kid_count, nation_old_count,
        bill_no
        } = payload
    const emp_code_last = empCode;

    const convCustName = Unicode2ASCII(payload.customer_name)
    const convNationCountry = Unicode2ASCII(payload.nation_country)
    const convCustNote = Unicode2ASCII(payload.customer_note)

    const sql = `UPDATE table_checkin 
                SET emp_code_last='${emp_code_last}', 
                macno='${macno}',
                customer_count='${customer_count}',
                thai_man_count='${thai_man_count}',
                thai_woman_count='${thai_woman_count}',
                thai_kid_count='${thai_kid_count}',
                thai_old_count='${thai_old_count}',
                nation_man_count='${nation_man_count}',
                nation_woman_count='${nation_woman_count}',
                nation_kid_count='${nation_kid_count}',
                nation_old_count='${nation_old_count}',
                customer_name='${convCustName}',
                member_code='${member_code}',
                book_no='${book_no}',
                nation_country='${convNationCountry}',
                customer_note='${convCustNote}',
                bill_no='${bill_no}',
                table_order_type_start='${table_order_type_start}' 
                WHERE Tcode='${tableNo}'`;
    const results = await pool.query(sql)

    // update tablefile
    await updateTableCustomer(tableNo, customer_count)

    return results
}

module.exports = {
    getTableInfo,
    createData,
    updateData,
    updateInActiveTable,
    getLastTableCheckIn
}
