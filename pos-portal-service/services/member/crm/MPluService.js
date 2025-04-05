const pool = require('../../../config/database/MyCrmDB')

const createMPlu = async payload => {
    const { Service_Date,Member_Code, Branch_Code, Receipt_No, PLU_Group,
        Sale_Type, PLU_GroupName, PLU_Code, PLU_Name,
        PLU_Amount, PLU_Quantity, PLU_Price, TranferFlag } = payload
    const sql = `INSERT INTO mplu 
        (Service_Date,Member_Code,Branch_Code,Receipt_No,PLU_Group,Sale_Type,PLU_GroupName,
        PLU_Code,PLU_Name,PLU_Amount,PLU_Quantity,PLU_Price,TranferFlag) 
        VALUES ('${Service_Date}','${Member_Code}','${Branch_Code}','${Receipt_No}','${PLU_Group}',
        '${Sale_Type}','${PLU_GroupName}','${PLU_Code}','${PLU_Name}','${PLU_Amount}','${PLU_Quantity}',
        '${PLU_Price}','${TranferFlag}')`;
    const result = await pool.query(sql)
    return result
}

const updateMPlu = async payload => {
    const { Service_Date,Member_Code, Branch_Code, Receipt_No, PLU_Group,
        Sale_Type, PLU_GroupName, PLU_Code, PLU_Name,
        PLU_Amount, PLU_Quantity, PLU_Price, TranferFlag } = payload
    const sql = `UPDATE mplu 
        SET Service_Date='${Service_Date}',
        Branch_Code='${Branch_Code}',
        PLU_Group='${PLU_Group}',
        Sale_Type='${Sale_Type}',
        PLU_GroupName='${PLU_GroupName}',
        PLU_Name='${PLU_Name}',
        PLU_Amount='${PLU_Amount}',
        PLU_Quantity='${PLU_Quantity}',
        PLU_Price='${PLU_Price}',
        TranferFlag='${TranferFlag}' 
        WHERE Receipt_No='${Receipt_No}' 
        and Member_Code='${Member_Code}' and PLU_Code='${PLU_Code}'`;
    const result = await pool.query(sql)
    return result
}

module.exports = {
    createMPlu,
    updateMPlu
}
