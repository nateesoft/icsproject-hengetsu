const path = require('path');
const fs = require('fs');

const { getDataByMacno } = require("./PosHwSetup")
const { getMoment } = require('../utils/MomentUtil');
const { getPOSConfigSetup } = require("./CoreService");
const { savePdfFile } = require("../utils/PdfUtil");
const { getCuponByRefno, getTempCuponByTable } = require("./CuponService");
const { getTCreditList } = require("./TCreditService");
const { getTGiftList, getTempGiftList } = require("./TGiftService");

const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

function maskData(data, visibleDigits = 4, maskChar = '*') {
  const dataStr = String(data);
  const maskedLength = Math.max(dataStr.length - visibleDigits, 0);
  const maskedPart = maskChar.repeat(maskedLength);
  const visiblePart = dataStr.slice(-visibleDigits);
  return maskedPart + visiblePart;
}

const formatPoint = (point) => {
  return point.toLocaleString()
}

const formatDate = data => {
  return getMoment(data).format("DD/MM/YYYY")
}

const formatDateTime = data => {
  return getMoment(data).format("HH:mm:ss")
}

const truncateWord = (text, maxLength = 25, mark="...") => {
  if (text.length <= maxLength) return text;
  let words = text.split(" ");
  let result = "";
  for (let word of words) {
    if ((result + word).length > maxLength) break;
    result += (result ? " " : "") + word;
  }
  return result + mark;
};

const publicPath = path.join(__dirname, '..', 'public', 'savePdf');
const getSavePdfPath = (p) => {
  const dayFolder = getMoment().format('YYYY-MM-DD')

  // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่ ถ้าไม่ก็กำหนดให้สร้าง
  if (!fs.existsSync(publicPath + "/" + dayFolder)) {
    fs.mkdirSync(publicPath + "/" + dayFolder, { recursive: true });
  }

  return path.join(publicPath + "/" + dayFolder, p)
}

const defaultLogo = 'com_logo.jpg'
const defaultFont = 'Angsana New'
const defaultWidth = 75
const defaultHeight = 75

const Divider = `
<div align="center">
  <font face="${defaultFont}" size="1">----------------------------------------------------------------------------------------------------</font>
</div>`

const flagToSavePdf = "Y" === process.env.SAVE_PDF_PRINTER

const printReceiptHtml = async ({ macno, billInfo, tSaleInfo, printerInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  const specialCupon = await getCuponByRefno(billInfo.B_Refno)
  const creditList = await getTCreditList(billInfo.B_Refno)
  const giftVoucherList = await getTGiftList(billInfo.B_Refno)

  const companyLogo = printerInfo.logo_name || defaultLogo
  const fontFamily = printerInfo.fontFamily || defaultFont
  const logoWidth = printerInfo.logo_width || defaultWidth
  const logoHeight = printerInfo.logo_height || defaultHeight

  const getDiscountPercent = strSlash => {
    // return `(${strSlash.split('/')[0]}%)`
    return strSlash
  }

  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  let footerHtml = `${Divider}`
  for (const [index, item] of footers.entries()) {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  }

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="${logoWidth}" height="${logoHeight}"></div>
    <div align="center">`;
    for (const [index, item] of headers.entries()) {
      if(index===0){
        header += `
          <div>
            <b><font face="${fontFamily}" size="5">${item}</font></b>
          </div>`
      }else{
        header += `
          <div>
            <font face="${fontFamily}" size="4">${item}</font>
          </div>`
      }
    }
    header += `</div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">REG ID: ${poshwSetup.MacNo}</font> 
      </div>
      <div>
        <font face="${fontFamily}" size="4">Receipt No: ${billInfo.B_Refno}</font> 
        <font face="${fontFamily}" size="4">Table No: ${billInfo.B_Table}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4">Date: ${formatDate(billInfo.B_OnDate)} ${billInfo.B_CashTime}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4"> Guest: ${billInfo.B_Cust} Staff: ${billInfo.B_Cashier} Mac:${billInfo.B_MacNo} </font>
      </div>
    </div>`
  let billTable = `
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <th align="left">
            <font face="${fontFamily}" size="4">Item Description</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Qty</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Amount</font>
          </th>
        </tr>`
    let tipsItem = `<div align="center">`
    for (const [index, tSale] of tSaleInfo.entries()) {
      if(tSale.R_PluCode=== 'TIPS') {
        tipsItem += `<font face="${fontFamily}" size="4">${truncateWord(tSale.R_PName)} ... ${formatNumber(tSale.R_Total)}</font>`
      }else{
        billTable += `
          <tr>
            <td style="max-width: 100px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
              <font face="${fontFamily}" size="4">${truncateWord(tSale.R_PName)}</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${tSale.R_Quan}</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(tSale.R_Total)}</font>
            </td>
          </tr>`
      }
    }
    
    billTable += `</table></div>`
    tipsItem += `</div>`

  const subTotalItems = tSaleInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)

  const totalDiscountAmount = billInfo.B_FastDiscAmt + billInfo.B_EmpDiscAmt + billInfo.B_MemDiscAmt + 
  billInfo.B_TrainDiscAmt + billInfo.B_SubDiscAmt + billInfo.B_SubDiscBath + billInfo.B_ItemDiscAmt +
  billInfo.B_ProDiscAmt + billInfo.B_CuponDiscAmt
  
  let B_GiftVoucher = ''
  if (billInfo.B_GiftVoucher>0) {
    B_GiftVoucher = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cash Voucher</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_GiftVoucher)}</font>
      </td>
    </tr>`
    for(let key in giftVoucherList) {
      const giftInfo = giftVoucherList[key]
      B_GiftVoucher += `<tr>
          <td>
            <font face="${fontFamily}" size="4">... ${giftInfo.giftno}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(giftInfo.giftamt)}</font>
          </td>
        </tr>`
    }
  }
  let B_FastDiscAmt = ''
  if (billInfo.B_FastDiscAmt>0) {
    B_FastDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Festival Discount ${getDiscountPercent(billInfo.B_FastDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_FastDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_EmpDiscAmt = ''
  if(billInfo.B_EmpDiscAmt>0){
    B_EmpDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Staff Discount ${getDiscountPercent(billInfo.B_EmpDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_EmpDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_MemDiscAmt = ''
  if(billInfo.B_MemDiscAmt>0){
    B_MemDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Member Discount ${getDiscountPercent(billInfo.B_MemDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_MemDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_TrainDiscAmt = ''
  if(billInfo.B_TrainDiscAmt>0){
    B_TrainDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Trainee Discount ${getDiscountPercent(billInfo.B_TrainDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_TrainDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscAmt = ''
  if(billInfo.B_SubDiscAmt>0){
    B_SubDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cupon Discount ${getDiscountPercent(billInfo.B_SubDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscBath = ''
  if(billInfo.B_SubDiscBath>0){
    B_SubDiscBath = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Baht Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscBath)}</font>
      </td>
    </tr>`
  }
  let B_CuponDiscAmt = ''
  if(specialCupon.length > 0){
    for(let key in specialCupon) {
      B_CuponDiscAmt += `<tr>
        <td>
          <font face="${fontFamily}" size="4">${specialCupon[key].CuName} (${specialCupon[key].CuDisc}%)</font>
        </td>
        <td align="right">
          <font face="${fontFamily}" size="4">${formatNumber(specialCupon[key].CuAmt)}</font>
        </td>
      </tr>`
    }
  }
  let B_ProDiscAmt = ''
  if(billInfo.B_ProDiscAmt>0){
    B_ProDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Promotion Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ProDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_ItemDiscAmt = ''
  if(billInfo.B_ItemDiscAmt>0){
    B_ItemDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Item Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ItemDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_Earnest = ''
  if(billInfo.B_Earnest>0){
    B_Earnest = `
    <tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Deposit</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)} -</font>
      </td>
    </tr>
    `
  }
  let B_Cash = ''
  if(billInfo.B_Cash>0){
    B_Cash = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Cash:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Cash)}</font>
      </td>
    </tr>`
  }
  let B_Ton = ''
  if(billInfo.B_Ton>0){
    B_Ton = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Change:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Ton)}</font>
      </td>
    </tr>`
  }
  let B_TransferAmt = ''
  // if(billInfo.B_TransferAmt>0) {
  //   B_TransferAmt = `<tr>
  //     <td>
  //       <font face="${fontFamily}" size="4">Transfer</font>
  //     </td>
  //     <td align="right">
  //       <font face="${fontFamily}" size="4">0.00</font>
  //     </td>
  //   </tr>`
  // }
  let B_CrAmt1 = ''
  if(billInfo.B_CrAmt1>0){
    B_CrAmt1 = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Credit Amount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CrAmt1)}</font>
      </td>
    </tr>`
    for(let key in creditList) {
      const creditInfo = creditList[key]
      B_CrAmt1 += `<tr>
          <td>
            <font face="${fontFamily}" size="4">... ${creditInfo.CrCode}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(creditInfo.CrAmt)}</font>
          </td>
        </tr>`
    }
  }

  let MemberInfo = ''
  if(billInfo.B_MemCode) {
    MemberInfo = `
    ${Divider}
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Member</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${maskData(billInfo.B_MemCode)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4"></font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_MemName?.split(" ")[0]}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Point</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatPoint(billInfo.B_MemCurSum)}</font>
          </td>
        </tr>
      </table>
    </div>`
  }

  let B_NetFood = ''
  if(billInfo.B_NetFood>0){
    B_NetFood += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Food</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetFood)}</font>
            </td>
          </tr>`
  }
  let B_NetDrink = ''
  if(billInfo.B_NetDrink>0){
    B_NetDrink += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Drink</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDrink)}</font>
            </td>
          </tr>`
  }
  let B_NetProduct = ''
  if(billInfo.B_NetProduct>0){
    B_NetProduct += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Other</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetProduct)}</font>
            </td>
          </tr>`
  }

  let showDiscount = ''
  if(totalDiscountAmount>0){
    showDiscount += `<tr>
        <td colspan="2">
          <font face="${fontFamily}" size="4">Discount...</font>
        </td>
      </tr>`
  }

  let displayDiscountAmount = ''
  if(totalDiscountAmount>0){
    displayDiscountAmount += `
    <tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Discount Amount:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(totalDiscountAmount)}</font>
      </td>
    </tr>`
  }

  let htmlContent = `
  <div style="padding: 2px;">
      ${header}
      ${billTable}
      ${Divider}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Item: ${subTotalItems}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center" style="margin-left: 10px;">
        <table width="100%" cellPadding="0" cellSpacing="0">
          ${B_NetFood}
          ${B_NetDrink}
          ${B_NetProduct}
        </table>
      </div>
      ${Divider}
      ${tipsItem}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Subtotal:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Total)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Service Charge(${parseInt(billInfo.B_Service)}%):</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)} +</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Before VAT:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${(formatNumber(billInfo.B_Total+billInfo.B_ServiceAmt))}</font>
            </td>
          </tr>
          ${showDiscount}
          ${B_FastDiscAmt}
          ${B_EmpDiscAmt}
          ${B_MemDiscAmt}
          ${B_TrainDiscAmt}
          ${B_SubDiscAmt}
          ${B_SubDiscBath}
          ${B_CuponDiscAmt}
          ${B_ProDiscAmt}
          ${B_ItemDiscAmt}
          ${displayDiscountAmount}
          <tr>
            <td colspan="2">${Divider}</td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal-billInfo.B_Vat)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">VAT(${posConfigSetup.P_Vat}%):</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Vat)}</font>
            </td>
          </tr>
          ${B_Earnest}
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Grand Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Round:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDiff)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
        <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td colspan="2">
                <font face="${fontFamily}" size="4">[Payment Detail]</font>
              </td>
            </tr>
            ${B_TransferAmt}
            ${B_CrAmt1}
            ${B_GiftVoucher}
            ${B_Cash}
            ${B_Ton}
          </table>
        </div>
      </div>
      ${MemberInfo}
      ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = getSavePdfPath("receipt_" + getMoment().format('YYYY-MM-DD_HHmmss')+".pdf")
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printReceiptCopyHtml = async ({ macno, billInfo, tSaleInfo, printerInfo }) => {
  const receiptHtmlContent = await printReceiptHtml({ macno, billInfo, tSaleInfo, printerInfo })

  const fontFamily = printerInfo.fontFamily || defaultFont

  const htmlContent = `
    <div align="right">
      <font face="${fontFamily}" size="4">Bill Copy (${billInfo.B_BillCopy})</font>
    </div>
    ${receiptHtmlContent}
  `

  if(flagToSavePdf){
    const pdfFile = getSavePdfPath("receipt_copy_" + getMoment().format('YYYY-MM-DD_HHmmss')+".pdf")
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printReviewReceiptHtml = async ({ macno, tableInfo, balanceInfo, printerInfo }) => {
  const poshwSetup = await getDataByMacno(macno)
  const specialCupon = await getTempCuponByTable(tableInfo.Tcode)
  const giftVoucherList = await getTempGiftList(tableInfo.Tcode)

  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  const companyLogo = printerInfo.logo_name || defaultLogo
  const fontFamily = printerInfo.fontFamily || defaultFont
  const logoWidth = printerInfo.logo_width || defaultWidth
  const logoHeight = printerInfo.logo_height || defaultHeight

  let footerHtml = `${Divider}`
  for (const [index, item] of footers.entries()) {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  }

  const tipsTotalAmount = balanceInfo.reduce((sum, item) => {
    return (item.R_PluCode==='TIPS') ? sum + item.R_Total : sum
  }, 0)

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="${logoWidth}" height="${logoHeight}"></div>
    <div align="center">`
    for (const [index, item] of headers.entries()) {
      if(index===0){
        header += `
          <div>
            <b><font face="${fontFamily}" size="5">${item}</font></b>
          </div>`
      }else{
        header += `
          <div>
            <font face="${fontFamily}" size="4">${item}</font>
          </div>
        `
      }
    }
    header += `<div align="center">
        <font face="${fontFamily}" size="4">*** ( Order review, not an official receipt ) ***</font>
    </div>`
    header += `</div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">Date: ${formatDateTime(new Date())} Table: ${tableInfo.Tcode}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4"> Guest: ${tableInfo.TCustomer} Staff: ${tableInfo.Cashier} Mac:${tableInfo.MacNo} </font>
      </div>
    </div>`
  let billTable = `
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <th align="left">
            <font face="${fontFamily}" size="4">Item Description</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Qty</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Amount</font>
          </th>
        </tr>`
  for (const [index, balance] of balanceInfo.entries()) {
    if (balance.R_Void === 'V' || balance.R_PluCode === 'TIPS') {
    }else{
      billTable += `
        <tr>
          <td style="left">
            <font face="${fontFamily}" size="4">${truncateWord(balance.R_PName)}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${balance.R_Quan}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(balance.R_Total)}</font>
          </td>
        </tr>`
    }
  }
  billTable += `</table></div>`

  const subTotalItems = balanceInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)

  let totalDiscountAmount = tableInfo.FastDiscAmt + tableInfo.EmpDiscAmt + tableInfo.MemDiscAmt 
  + tableInfo.TrainDiscAmt + tableInfo.SubDiscAmt + tableInfo.DiscBath + tableInfo.CuponDiscAmt

  const getDiscountPercent = strSlash => {
    // return `(${strSlash.split('/')[0]}%)`
    return strSlash
  }

  let B_GiftVoucher = ''
  if (tableInfo.GiftVoucher_Amt>0) {
    B_GiftVoucher = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cash Voucher</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.GiftVoucher_Amt)}</font>
      </td>
    </tr>`
    for(let key in giftVoucherList) {
      const giftInfo = giftVoucherList[key]
      B_GiftVoucher += `<tr>
          <td>
            <font face="${fontFamily}" size="4">... ${giftInfo.giftno}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(giftInfo.giftamt)}</font>
          </td>
        </tr>`
    }
  }

  let B_FastDiscAmt = ''
  if (tableInfo.FastDiscAmt>0) {
    B_FastDiscAmt = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Festival Discount ${getDiscountPercent(tableInfo.FastDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.FastDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_EmpDiscAmt = ''
  if(tableInfo.EmpDiscAmt>0){
    B_EmpDiscAmt = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Staff Discount ${getDiscountPercent(tableInfo.EmpDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.EmpDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_MemDiscAmt = ''
  if(tableInfo.MemDiscAmt>0){
    B_MemDiscAmt = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Member Discount ${getDiscountPercent(tableInfo.MemDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.MemDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_TrainDiscAmt = ''
  if(tableInfo.TrainDiscAmt>0){
    B_TrainDiscAmt = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Trainee Discount ${getDiscountPercent(tableInfo.TrainDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.TrainDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscAmt = ''
  if(tableInfo.SubDiscAmt>0){
    B_SubDiscAmt = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Cupon Discount ${getDiscountPercent(tableInfo.SubDisc)}</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.SubDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscBath = ''
  if(tableInfo.DiscBath>0){
    B_SubDiscBath = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Baht Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.DiscBath)}</font>
      </td>
    </tr>`
  }
  let B_CuponDiscAmt = ''
  if(specialCupon.length > 0){
    for(let key in specialCupon) {
      B_CuponDiscAmt += `<tr>
        <td>
          <font face="${fontFamily}" size="4">${specialCupon[key].CuName} (${specialCupon[key].CuDisc}%)</font>
        </td>
        <td align="right">
          <font face="${fontFamily}" size="4">${formatNumber(specialCupon[key].CuAmt)}</font>
        </td>
      </tr>`
    }
  }
  let B_ProDiscAmt = ''
  if(tableInfo.ProDiscAmt>0){
    B_ProDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Promotion Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.ProDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_ItemDiscAmt = ''
  if(tableInfo.ItemDiscAmt>0){
    B_ItemDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Item Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.ItemDiscAmt)}</font>
      </td>
    </tr>`
  }

  let showDiscount = ''
  if(totalDiscountAmount>0){
    showDiscount += `<tr>
          <td colspan="2">
            <font face="${fontFamily}" size="4">Discount...</font>
          </td>
        </tr>`
  }

  let Food = ''
  if(tableInfo.Food>0){
    Food += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Food</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Food)}</font>
            </td>
          </tr>`
  }
  let Drink = ''
  if(tableInfo.Drink>0){
    Drink += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Drink</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Drink)}</font>
            </td>
          </tr>`
  }
  let Product = ''
  if(tableInfo.Product>0){
    Product += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Other</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Product)}</font>
            </td>
          </tr>`
  }

  let DepositAmount = ''
  if(tableInfo.DepositAmt > 0) {
    DepositAmount += `
    <tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Deposit</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.DepositAmt)} -</font>
      </td>
    </tr>`
  }

  let displayDiscountAmount = ''
  if(totalDiscountAmount>0){
    displayDiscountAmount += `
    <tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Discount Amount:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(totalDiscountAmount)}</font>
      </td>
    </tr>`
  }

  let MemberInfo = ''
  if(tableInfo.MemCode) {
    MemberInfo = `
    ${Divider}
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Member</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${maskData(tableInfo.MemCode)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4"></font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${tableInfo.MemName?.split(" ")[0]}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Point</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatPoint(tableInfo.MemCurAmt)}</font>
          </td>
        </tr>
      </table>
    </div>`
  }

  const htmlContent = `
  <div style="padding: 2px;">
    ${header}
    ${billTable}
    ${Divider}
    <div align="center">
      <table width="100%">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Item: ${subTotalItems}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4"></font>
          </td>
        </tr>
      </table>
    </div>
    ${Divider}
    <div style="margin-left: '10px'">
      <table width="100%" cellPadding="0" cellSpacing="0">
        ${Food}
        ${Drink}
        ${Product}
      </table>
    </div>
    ${Divider}
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="right">
              <font face="${fontFamily}" size="4">Subtotal:</font>
          </td>
          <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(tableInfo.TAmount)}</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Service Charge(${parseInt(tableInfo.Service)}%):</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.ServiceAmt)} +</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Before VAT:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.SubTotal_Amt)}</font>
          </td>
        </tr>
        ${showDiscount}
        ${B_FastDiscAmt}
        ${B_EmpDiscAmt}
        ${B_MemDiscAmt}
        ${B_TrainDiscAmt}
        ${B_SubDiscAmt}
        ${B_SubDiscBath}
        ${B_CuponDiscAmt}
        ${B_ProDiscAmt}
        ${B_ItemDiscAmt}
        ${displayDiscountAmount}
        <tr>
          <td colspan="2">${Divider}</td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Total:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.SubTotal_Amt-totalDiscountAmount)}</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">VAT(${tableInfo.Vat}%):</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.VatAmt)}</font>
          </td>
        </tr>
        ${DepositAmount}
        ${B_GiftVoucher}
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Grand Total:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.NetTotal-tableInfo.DepositAmt-tableInfo.GiftVoucher_Amt)}</font>
          </td>
        </tr>
      </table>
    </div>
    <div align="center" style="margin: 5px">
      <font face="${fontFamily}" size="4">Tips ……………${(tipsTotalAmount>0) ? formatNumber(tipsTotalAmount): ""}………………</font>
    </div>
  </div>
  ${MemberInfo}
  ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = getSavePdfPath("review_" + getMoment().format('YYYY-MM-DD_HHmmss')+".pdf")
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printRefundBillHtml = async ({ macno, billInfo, tSaleInfo, printerInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  const specialCupon = await getCuponByRefno(billInfo.B_Refno)
  const creditList = await getTCreditList(billInfo.B_Refno)
  const giftVoucherList = await getTGiftList(billInfo.B_Refno)

  const companyLogo = printerInfo.logo_name || defaultLogo
  const fontFamily = printerInfo.fontFamily || defaultFont
  const logoWidth = printerInfo.logo_width || defaultWidth
  const logoHeight = printerInfo.logo_height || defaultHeight

  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  let footerHtml = `${Divider}`
  for (const [index, item] of footers.entries()) {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  }

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="${logoWidth}" height="${logoHeight}"></div>
    <div align="center">`
    for (const [index, item] of headers.entries()) {
      if(index===0){
        header += `
          <div>
            <b><font face="${fontFamily}" size="5">${item}</font></b>
          </div>`
      }else{
        header += `
          <div>
            <font face="${fontFamily}" size="4">${item}</font>
          </div>`
      }
    }
    header += `</div>`
    header += `<div align="center">
      <div>
        <font face="${fontFamily}" size="4">*** (Receipt Refund) ***</font>
      </div>
    </div>`

    header += `<div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="left">
            <font face="${fontFamily}" size="4">Receipt No.: ${billInfo.B_Refno}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">Table No: ${billInfo.B_Table} ... </font>
          </td>
        </tr>
        <tr>
          <td align="center" colspan="2">
            <font face="${fontFamily}" size="4">REG ID: ${poshwSetup.MacNo}</font>
          </td>
        </tr>
        <tr>
          <td align="left">
            <font face="${fontFamily}" size="4">Staff Void: ${billInfo.B_VoidUser}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">Void Time: ${billInfo.B_VoidTime}</font>
          </td>
        </tr>
      </table>
    </div>`
  let billTable = `
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <th align="left">
            <font face="${fontFamily}" size="4">Item Description</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Qty</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Amount</font>
          </th>
        </tr>`
      let tipsItem = `<div align="center">`
      for (const [index, tSale] of tSaleInfo.entries()) {
        if(tSale.R_PluCode=== 'TIPS') {
          tipsItem += `<font face="${fontFamily}" size="4">${truncateWord(tSale.R_PName)} ... ${formatNumber(tSale.R_Total)}</font>`
          return
        }
        billTable += `
        <tr>
          <td style="max-width: 100px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
            <font face="${fontFamily}" size="4">${truncateWord(tSale.R_PName)}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${tSale.R_Quan}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tSale.R_Total)}</font>
          </td>
        </tr>`
      }
      billTable += `</table></div>`
      tipsItem += `</div>`

  const subTotalItems = tSaleInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)

  const totalDiscountAmount = billInfo.B_FastDiscAmt + billInfo.B_EmpDiscAmt + billInfo.B_MemDiscAmt + 
  billInfo.B_TrainDiscAmt + billInfo.B_SubDiscAmt + billInfo.B_SubDiscBath + billInfo.B_ItemDiscAmt +
  billInfo.B_ProDiscAmt + billInfo.B_CuponDiscAmt

  let B_GiftVoucher = ''
  if (billInfo.B_GiftVoucher>0) {
    B_GiftVoucher = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cash Voucher</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_GiftVoucher)}</font>
      </td>
    </tr>`
    for(let key in giftVoucherList) {
      const giftInfo = giftVoucherList[key]
      B_GiftVoucher += `<tr>
          <td>
            <font face="${fontFamily}" size="4">... ${giftInfo.giftno}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(giftInfo.giftamt)}</font>
          </td>
        </tr>`
    }
  }
  let B_FastDiscAmt = ''
  if (billInfo.B_FastDiscAmt > 0) {
    B_FastDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Festival Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_FastDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_EmpDiscAmt = ''
  if (billInfo.B_EmpDiscAmt > 0) {
    B_EmpDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Staff Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_EmpDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_MemDiscAmt = ''
  if (billInfo.B_MemDiscAmt > 0) {
    B_MemDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Member Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_MemDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_TrainDiscAmt = ''
  if (billInfo.B_TrainDiscAmt > 0) {
    B_TrainDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Trainee Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_TrainDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_SubDiscAmt = ''
  if (billInfo.B_SubDiscAmt > 0) {
    B_SubDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Cupon Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_SubDiscBath = ''
  if (billInfo.B_SubDiscBath > 0) {
    B_SubDiscBath = `<tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Baht Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscBath)}</font>
          </td>
        </tr>`
  }
  let B_CuponDiscAmt = ''
  if(specialCupon.length > 0){
    for(let key in specialCupon) {
      B_CuponDiscAmt += `<tr>
        <td>
          <font face="${fontFamily}" size="4">${specialCupon[key].CuName} (${specialCupon[key].CuDisc}%)</font>
        </td>
        <td align="right">
          <font face="${fontFamily}" size="4">${formatNumber(specialCupon[key].CuAmt)}</font>
        </td>
      </tr>`
    }
  }
  let B_ProDiscAmt = ''
  if (billInfo.B_ProDiscAmt > 0) {
    B_ProDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Promotion Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ProDiscAmt)}</font>
          </td>
        </tr>`
  }
  let B_ItemDiscAmt = ''
  if (billInfo.B_ItemDiscAmt > 0) {
    B_ItemDiscAmt = `<tr>
          <td>
            <font face="${fontFamily}" size="4">Item Discount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ItemDiscAmt)}</font>
          </td>
        </tr>`
  }

  let B_Earnest = ''
  if (billInfo.B_Earnest > 0) {
    B_Earnest = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Deposit</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)} -</font>
      </td>
    </tr>`
  }
  let B_Cash = ''
  if (billInfo.B_Cash > 0) {
    B_Cash = `<tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Cash:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Cash)}</font>
      </td>
    </tr>`
  }
  let B_Ton = ''
  if (billInfo.B_Ton > 0) {
    B_Ton = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Change</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Ton)}</font>
      </td>
    </tr>`
  }
  let B_TransferAmt = ''
  // if(billInfo.B_TransferAmt>0) {
  //   B_TransferAmt = `<tr>
  //     <td>
  //       <font face="${fontFamily}" size="4">Transfer</font>
  //     </td>
  //     <td align="right">
  //       <font face="${fontFamily}" size="4">0.00</font>
  //     </td>
  //   </tr>`
  // }
  let B_CrAmt1 = ''
  if (billInfo.B_CrAmt1 > 0) {
    B_CrAmt1 = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Credit Amount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CrAmt1)}</font>
      </td>
    </tr>`
    for(let key in creditList) {
      const creditInfo = creditList[key]
      B_CrAmt1 += `<tr>
          <td>
            <font face="${fontFamily}" size="4">... ${creditInfo.CrCode}</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(creditInfo.CrAmt)}</font>
          </td>
        </tr>`
    }
  }

  let MemberInfo = ''
  if(billInfo.B_MemCode) {
    MemberInfo = `
    ${Divider}
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Member</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${maskData(billInfo.B_MemCode)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4"></font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_MemName?.split(" ")[0]}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Point</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatPoint(billInfo.B_MemCurSum)}</font>
          </td>
        </tr>
      </table>
    </div>`
  }

  let B_NetFood = ''
  if(billInfo.B_NetFood>0){
    B_NetFood += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Food</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetFood)}</font>
            </td>
          </tr>`
  }
  let B_NetDrink = ''
  if(billInfo.B_NetDrink>0){
    B_NetDrink += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Drink</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDrink)}</font>
            </td>
          </tr>`
  }
  let B_NetProduct = ''
  if(billInfo.B_NetProduct>0){
    B_NetProduct += `<tr>
            <td>
              <font face="${fontFamily}" size="4">Other</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetProduct)}</font>
            </td>
          </tr>`
  }

  let showDiscount = ''
  if(totalDiscountAmount>0){
    showDiscount += `<tr>
        <td colspan="2">
          <font face="${fontFamily}" size="4">Discount...</font>
        </td>
      </tr>`
  }

  let displayDiscountAmount = ''
  if(totalDiscountAmount>0){
    displayDiscountAmount += `
    <tr>
      <td align="right">
        <font face="${fontFamily}" size="4">Discount Amount:</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(totalDiscountAmount)}</font>
      </td>
    </tr>`
  }

  const htmlContent = `
    <div style="padding: 2px;">
      ${header}
      ${billTable}
      ${Divider}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Item: ${subTotalItems}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center" style="margin-left: 10px;">
        <table width="100%" cellPadding="0" cellSpacing="0">
        ${B_NetFood}
        ${B_NetDrink}
        ${B_NetProduct}
        </table>
      </div>
      ${Divider}
      ${tipsItem}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Subtotal:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Total)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Service Charge(${parseInt(billInfo.B_Service)}%):</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)} +</font>
            </td>
          </tr>
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Before VAT:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Total+billInfo.B_ServiceAmt)}</font>
            </td>
          </tr>
          ${showDiscount}
          ${B_FastDiscAmt}
          ${B_EmpDiscAmt}
          ${B_MemDiscAmt}
          ${B_TrainDiscAmt}
          ${B_SubDiscAmt}
          ${B_SubDiscBath}
          ${B_CuponDiscAmt}
          ${B_ProDiscAmt}
          ${B_ItemDiscAmt}
          ${displayDiscountAmount}
          <tr>
            <td colspan="2">${Divider}</td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal-billInfo.B_Vat)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">VAT(${posConfigSetup.P_Vat}%):</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Vat)}</font>
            </td>
          </tr>
          ${B_Earnest}
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Grand Total:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Round:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDiff)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td colspan="2">
                <font face="${fontFamily}" size="4">[Payment Detail]</font>
              </td>
            </tr>
            ${B_Earnest}
            ${B_TransferAmt}
            ${B_CrAmt1}
            ${B_GiftVoucher}
            ${B_Cash}
            ${B_Ton}
          </table>
      </div>
      ${MemberInfo}
      ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = getSavePdfPath("refund_receipt" + getMoment().format('YYYY-MM-DD_HHmmss')+".pdf")
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printPaidInOutHtml = async ({ branchName, cashier, paidInOutAmt, typeDesc, timeProcess, reason, macno, printerInfo }) => {
  const fontFamily = printerInfo.fontFamily || defaultFont

  const htmlContent = `
    ${Divider}
    <div align="center">Cash In/Out Records</div>
    ${Divider}
    <table width="100%">
      <thead>
          <tr>
              <td><font face="${fontFamily}" size="4">Branch</font></td>
              <td><font face="${fontFamily}" size="4">${branchName}</font></td>
          </tr>
          <tr>
              <td><font face="${fontFamily}" size="4">Terminal</font></td>
              <td><font face="${fontFamily}" size="4">${macno}</font></td>
          </tr>
          <tr>
              <td><font face="${fontFamily}" size="4">Staff ID</font></td>
              <td><font face="${fontFamily}" size="4">${cashier}</font></td>
          </tr>
          <tr>
              <td colspan="2" align="center">${Divider}</td>
          </tr>
      </thead>
      <tbody>
          <tr>
              <td><font face="${fontFamily}" size="4">Type</font></td>
              <td><font face="${fontFamily}" size="4">${typeDesc}</font></td>
          </tr>
          <tr>
              <td><font face="${fontFamily}" size="4">Amount</font></td>
              <td><font face="${fontFamily}" size="4">${formatNumber(paidInOutAmt)}</font></td>
          </tr>
          <tr>
              <td><font face="${fontFamily}" size="4">Reason to process</font></td>
              <td><font face="${fontFamily}" size="4">${reason}</font></td>
          </tr>
          <tr>
              <td><font face="${fontFamily}" size="4">Date/Time</font></td>
              <td><font face="${fontFamily}" size="4">${timeProcess}</font></td>
          </tr>
          <tr>
              <td colspan="2" align="center">${Divider}</td>
          </tr>
      </tbody>
    </table>
  `

  if(flagToSavePdf){
    const pdfFile = getSavePdfPath("paidinout_" + getMoment().format('YYYY-MM-DD_HHmmss')+".pdf")
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

module.exports = {
  printReceiptHtml,
  printReviewReceiptHtml,
  printRefundBillHtml,
  printReceiptCopyHtml,
  printPaidInOutHtml
}
