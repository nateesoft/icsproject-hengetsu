const pool = require("../../config/database")
const { mappingResultDataList, mappingResultData } = require("../../utils/ConvertThai")

const createPosSetting = async (payload) => {
  const {
    id,
    language_main,
    language_main_title,
    language_use,
    language_use_title,
    timezone_main,
    timezone_use,
    currency_baht_rate,
    currency_baht,
    currency_use_rate,
    currency_use,
    receipt_printer_ip,
    kichen_printer_ip,
    create_date,
    user_update,
    terminal_id
  } = payload
  const sql = `INSERT INTO pos_setting (id,language_main,language_main_title,language_use,language_use_title,
        timezone_main,timezone_use,currency_baht_rate,currency_baht,
        currency_use_rate,currency_use,receipt_printer_ip,kichen_printer_ip,
        create_date, user_update, terminal_id) 
      VALUES ('${id}', '${language_main}', '${language_main_title}', '${language_use}', '${language_use_title}',
        '${timezone_main}', '${timezone_use}', '${currency_baht_rate}', '${currency_baht}', '${currency_use_rate}',
        '${currency_use}', '${receipt_printer_ip}', '${kichen_printer_ip}',
        '${create_date}', '${user_update}', '${terminal_id}')`
  const results = await pool.query(sql)
  return results
}

const updatePosSetting = async (payload) => {
  const {
    id,
    language_main,
    language_main_title,
    language_use,
    language_use_title,
    timezone_main,
    timezone_use,
    currency_baht_rate,
    currency_baht,
    currency_use_rate,
    currency_use,
    receipt_printer_ip,
    kichen_printer_ip,
    update_date,
    user_update,
    terminal_id
  } = payload
  const sql = `UPDATE pos_setting 
      SET language_main='${language_main}',
        language_main_title='${language_main_title}',
        language_use='${language_use}',
        language_use_title='${language_use_title}',
        timezone_main='${timezone_main}',
        timezone_use='${timezone_use}',
        currency_baht_rate='${currency_baht_rate}',
        currency_baht='${currency_baht}',
        currency_use_rate='${currency_use_rate}',
        currency_use='${currency_use}',
        receipt_printer_ip='${receipt_printer_ip}',
        kichen_printer_ip='${kichen_printer_ip}',
        update_date='${update_date}',
        user_update='${user_update}',
        terminal_id='${terminal_id}' 
        WHERE id='${id}'`
  const results = await pool.query(sql)
  return results
}

const getPosSetting = async () => {
  const sql = `select * from pos_setting`
  const results = await pool.query(sql)
  return mappingResultDataList(results)
}

const getPosSettingByTerminal = async (terminal_id) => {
  const sql = `select * from pos_setting where terminal_id='${terminal_id}'`
  const results = await pool.query(sql)
  if (results.length > 0) {
    return mappingResultData(results)
  }
  return null
}

module.exports = {
  createPosSetting,
  updatePosSetting,
  getPosSetting,
  getPosSettingByTerminal
}
