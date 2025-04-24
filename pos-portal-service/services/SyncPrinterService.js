const { getDataByMacno } = require("./PosHwSetup")
const { getMoment } = require('../utils/MomentUtil');
const { getPOSConfigSetup } = require("./CoreService");
const { savePdfFile } = require("../utils/PdfUtil");
const { getCuponByRefno } = require("./CuponService");
const { getTCreditList } = require("./TCreditService");
const { getTGiftList } = require("./TGiftService");

const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatPoint = (point) => {
  return point.toLocaleString()
}

const formatDate = data => {
  return getMoment(data).format("DD/MM/YYYY")
}

const formatDateTime = data => {
  return getMoment(data).format("HH:mm:ss")
}

const truncateWord = (text, maxLength = 25) => {
  if (text.length <= maxLength) return text;
  let words = text.split(" ");
  let result = "";
  for (let word of words) {
    if ((result + word).length > maxLength) break;
    result += (result ? " " : "") + word;
  }
  return result + "...";
};

const companyLogo = process.env.PRINT_LOGO || `com_logo.jpg`
const fontFamily = process.env.RECEIPT_FONT_FAMILY || `Angsana New`
const fontSize = process.env.FONT_SIZE || `4`

const Divider = `
<div align="center">
  <font face="${fontFamily}" size="1">----------------------------------------------------------------------------------------------------</font>
</div>`

const flagToSavePdf = "Y" === process.env.SAVE_PDF_PRINTER

const printReceiptHtml = async ({ macno, billInfo, tSaleInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  const specialCupon = await getCuponByRefno(billInfo.B_Refno)
  const creditList = await getTCreditList(billInfo.B_Refno)
  const giftVoucherList = await getTGiftList(billInfo.B_Refno)

  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  let footerHtml = `${Divider}`
  footers.forEach(item => {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  })

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="100" height="100" /></div>
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
        <font face="${fontFamily}" size="4">Receipt No: ${billInfo.B_Refno}</font>
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
    tSaleInfo.forEach(tSale => {
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
    })
    
    billTable += `</table></div>`
    tipsItem += `</div>`

  const subTotalItems = tSaleInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)
  
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
        <font face="${fontFamily}" size="4">Festival Discount</font>
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
        <font face="${fontFamily}" size="4">Staff Discount</font>
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
        <font face="${fontFamily}" size="4">Member Discount</font>
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
        <font face="${fontFamily}" size="4">Trainee Discount</font>
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
        <font face="${fontFamily}" size="4">Cupon Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscBath = ''
  if(billInfo.B_SubDiscBath>0){
    B_SubDiscBath = `<tr>
      <td>
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
          <font face="${fontFamily}" size="4">${specialCupon[key].CuName}</font>
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
    B_Earnest = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Deposit Deduction</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)}</font>
      </td>
    </tr>`
  }
  let B_Entertain = ''
  if(billInfo.B_Entertain>0){
    B_Entertain = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Entertain Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Entertain)}</font>
      </td>
    </tr>`
  }
  let B_Cash = ''
  if(billInfo.B_Cash>0){
    B_Cash = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cash</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Cash)}</font>
      </td>
    </tr>`
  }
  let B_Ton = ''
  if(billInfo.B_Ton>0){
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
            <font face="${fontFamily}" size="4">${billInfo.B_MemCode}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4"></font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_MemName}</font>
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
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Before VAT:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${(formatNumber(billInfo.B_NetVat - billInfo.B_Vat))}</font>
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
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Cash voucher:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_GiftVoucher)}</font>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              ${Divider}
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Grand Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal-billInfo.B_GiftVoucher)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
        <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            ${B_Earnest}
            ${B_Entertain}
            ${B_GiftVoucher}
            <tr>
              <td colspan="2">
                <font face="${fontFamily}" size="4">[Payment Detail]</font>
              </td>
            </tr>
            ${B_Cash}
            ${B_Ton}
            ${B_TransferAmt}
            ${B_CrAmt1}
            ${B_FastDiscAmt}
            ${B_EmpDiscAmt}
            ${B_MemDiscAmt}
            ${B_TrainDiscAmt}
            ${B_SubDiscAmt}
            ${B_SubDiscBath}
            ${B_CuponDiscAmt}
            ${B_ProDiscAmt}
            ${B_ItemDiscAmt}
          </table>
        </div>
      </div>
      ${MemberInfo}
      ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = "/Users/tx091511/Documents/pdf/receipt_" + getMoment().format('YYYY-MM-DD')+".pdf"
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printReceiptCopyHtml = async ({ macno, billInfo, tSaleInfo }) => {
  const receiptHtmlContent = await printReceiptHtml({ macno, billInfo, tSaleInfo })
  const htmlContent = `
    <div align="right">
      <font face="${fontFamily}" size="4">Bill Copy (${billInfo.B_BillCopy})</font>
    </div>
    ${receiptHtmlContent}
  `

  if(flagToSavePdf){
    const pdfFile = "/Users/tx091511/Documents/pdf/receipt_copy_" + getMoment().format('YYYY-MM-DD')+".pdf"
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printReviewReceiptHtml = async ({ macno, tableInfo, balanceInfo }) => {
  const poshwSetup = await getDataByMacno(macno)
  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  let footerHtml = `${Divider}`
  footers.forEach(item => {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  })

  const tipsTotalAmount = balanceInfo.reduce((sum, item) => {
    return (item.R_PluCode==='TIPS') ? sum + item.R_Total : sum
  }, 0)

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="100" height="100" /></div>
    <div align="center">
        <font face="${fontFamily}" size="4">*** ( Order review, not an official receipt ) ***</font>
    </div>
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
    header += `</div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">Table: ${tableInfo.Tcode}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4">Date: ${formatDateTime(new Date())}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4"> Staff: ${tableInfo.TCustomer} Cashier: ${tableInfo.Cashier} Mac:${tableInfo.MacNo} </font>
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
  
  balanceInfo && balanceInfo.forEach(balance => {
    if (balance.R_Void === 'V' || balance.R_PluCode === 'TIPS') {
      return
    }
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
  })
  billTable += `</table></div>`

  const subTotalItems = balanceInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)

  const totalDiscountAmount = tableInfo.FastDiscAmt + tableInfo.EmpDiscAmt + tableInfo.MemDiscAmt + tableInfo.TrainDiscAmt + tableInfo.SubDiscAmt + tableInfo.DiscBath

  let B_FastDiscAmt = ''
  if (tableInfo.FastDiscAmt>0) {
    B_FastDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Festival Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.FastDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_EmpDiscAmt = ''
  if(tableInfo.EmpDiscAmt>0){
    B_EmpDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Staff Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.EmpDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_MemDiscAmt = ''
  if(tableInfo.MemDiscAmt>0){
    B_MemDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Member Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.MemDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_TrainDiscAmt = ''
  if(tableInfo.TrainDiscAmt>0){
    B_TrainDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Trainee Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.TrainDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscAmt = ''
  if(tableInfo.SubDiscAmt>0){
    B_SubDiscAmt = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cupon Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.B_SubDiscAmt)}</font>
      </td>
    </tr>`
  }
  let B_SubDiscBath = ''
  if(tableInfo.DiscBath>0){
    B_SubDiscBath = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Baht Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(tableInfo.DiscBath)}</font>
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
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.NetTotal)}</font>
          </td>
        </tr>
      </table>
    </div>
    ${Divider}
    <div style="margin-left: '10px'">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Food</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Food)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Drink</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Drink)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Other</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Product)}</font>
          </td>
        </tr>
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
                <font face="${fontFamily}" size="4">${formatNumber(tableInfo.NetTotal)}</font>
            </td>
          </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Service Charge(${parseInt(tableInfo.Service)}%)</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.ServiceAmt)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Before VAT</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.TAmount)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">VAT(${tableInfo.Vat}%)</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.VatAmt)}</font>
          </td>
        </tr>
        <tr>
          <td colspan="2">${Divider}</td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Discount Amount</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(totalDiscountAmount)}</font>
          </td>
        </tr>
        <tr>
          <td colspan="2">${Divider}</td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Total:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.NetTotal-totalDiscountAmount)}</font>
          </td>
        </tr>
      </table>
    </div>
    <div align="center" style="margin: 5px">
      <font face="${fontFamily}" size="4">Tips ……………${(tipsTotalAmount>0) ? formatNumber(tipsTotalAmount): ""}………………</font>
    </div>
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        ${showDiscount}
        ${B_FastDiscAmt}
        ${B_EmpDiscAmt}
        ${B_MemDiscAmt}
        ${B_TrainDiscAmt}
        ${B_SubDiscAmt}
        ${B_SubDiscBath}
      </table>
    </div>
  </div>
  ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = "/Users/tx091511/Documents/pdf/review_" + getMoment().format('YYYY-MM-DD')+".pdf"
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printRefundBillHtml = async ({ macno, billInfo, tSaleInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  const specialCupon = await getCuponByRefno(billInfo.B_Refno)
  const creditList = await getTCreditList(billInfo.B_Refno)
  const giftVoucherList = await getTGiftList(billInfo.B_Refno)

  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")
  let footers = [poshwSetup.Footting1||"", poshwSetup.Footting2||"", poshwSetup.Footting3||""]
  footers = footers.filter(h => h !== "")

  let footerHtml = `${Divider}`
  footers.forEach(item => {
    footerHtml += `<div align="center">
      <font face="${fontFamily}" size="4">${item}</font>
    </div>`
  })

  let header = `
    <div align="center"><img src="file:${companyLogo}" width="100" height="100"></div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">*** (Receipt Refund) ***</font>
      </div>
    </div>
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
    header += `</div>
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="left">
            <font face="${fontFamily}" size="4">Refer Receipt No.:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4"> ${billInfo.B_Refno}</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">REG ID:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4"> ${billInfo.B_MacNo}</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Staff Void:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_VoidUser}</font>
          </td>
        </tr>
        <tr>
          <td align="right">
            <font face="${fontFamily}" size="4">Void Time:</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_VoidTime}</font>
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
      tSaleInfo.forEach(tSale => {
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
      })
      billTable += `</table></div>`
      tipsItem += `</div>`

  const subTotalItems = tSaleInfo.reduce((sum, item) => {
    return (item.R_Void !== 'V') ? sum + item.R_Quan: sum
  }, 0)

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
          <td>
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
          <font face="${fontFamily}" size="4">${specialCupon[key].CuName}</font>
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
      <td>
        <font face="${fontFamily}" size="4">Deposit Deduction</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)}</font>
      </td>
    </tr>`
  }
  let B_Entertain = ''
  if (billInfo.B_Entertain > 0) {
    B_Entertain = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Entertain Discount</font>
      </td>
      <td align="right">
        <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Entertain)}</font>
      </td>
    </tr>`
  }
  let B_Cash = ''
  if (billInfo.B_Cash > 0) {
    B_Cash = `<tr>
      <td>
        <font face="${fontFamily}" size="4">Cash</font>
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
            <font face="${fontFamily}" size="4">${billInfo.B_MemCode}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4"></font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${billInfo.B_MemName}</font>
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
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Food</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetFood)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Drink</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDrink)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Other</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetProduct)}</font>
            </td>
          </tr>
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
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Before VAT:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetVat - billInfo.B_Vat)}</font>
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
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Total:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
          <tr>
            <td align="right">
              <font face="${fontFamily}" size="4">Cash voucher:</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_GiftVoucher)}</font>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              ${Divider}
            </td>
          </tr>
          <tr>
            <td align="right">
                <font face="${fontFamily}" size="4">Grand Total:</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal-billInfo.B_GiftVoucher)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            ${B_Earnest}
            ${B_Entertain}
            ${B_GiftVoucher}
            <tr>
              <td colspan="2">
                <font face="${fontFamily}" size="4">[Payment Detail]</font>
              </td>
            </tr>
            ${B_Cash}
            ${B_Ton}
            ${B_TransferAmt}
            ${B_CrAmt1}
            ${B_FastDiscAmt}
            ${B_EmpDiscAmt}
            ${B_MemDiscAmt}
            ${B_TrainDiscAmt}
            ${B_SubDiscAmt}
            ${B_SubDiscBath}
            ${B_CuponDiscAmt}
            ${B_ProDiscAmt}
            ${B_ItemDiscAmt}
          </table>
      </div>
      ${MemberInfo}
      ${footerHtml}
  </div>`

  if(flagToSavePdf){
    const pdfFile = "/Users/tx091511/Documents/pdf/refund_receipt" + getMoment().format('YYYY-MM-DD')+".pdf"
    await savePdfFile(htmlContent, pdfFile)
  }

  return htmlContent
}

const printPaidInOutHtml = async ({ branchName, cashier, paidInOutAmt, typeDesc, timeProcess, reason, macno }) => {
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
    const pdfFile = "/Users/tx091511/Documents/pdf/paidinout_" + getMoment().format('YYYY-MM-DD')+".pdf"
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
