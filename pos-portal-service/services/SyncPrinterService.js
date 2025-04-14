const { getDataByMacno } = require("./PosHwSetup")
const { getMoment } = require('../utils/MomentUtil');
const { getPOSConfigSetup } = require("./CoreService");

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

const companyLogo = `com_logo.jpg`
const fontFamily = process.env.RECEIPT_FONT_FAMILY || `Angsana New`
const Divider = `
<div align="center">
  <font face="${fontFamily}" size="1">----------------------------------------------------------------------------------------------------</font>
</div>`
const footer = `
    ${Divider}
    <div align="center">
      <font face="${fontFamily}" size="4"> (VAT INCLUDED)</font>
    </div>
    <div align="center">
      <font face="${fontFamily}" size="4">E-mail GM@.com</font>
    </div>
    <div align="center">
      <font face="${fontFamily}" size="4">Facebook Restaurant</font>
    </div>
    <div align="center">
      <font face="${fontFamily}" size="4">มีอะไรก็ติดต่อมาได้ตลอด / Feedback</font>
    </div>`

const printReceiptHtml = async ({ macno, billInfo, tSaleInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")

  let header = `
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">*** ใบเสร็จรับเงิน ***</font>
      </div>
    </div>
    <div align="center">`;
    headers.forEach(item => {
      header += `
        <div>
          <font face="${fontFamily}" size="4">${item}</font>
        </div>`
    })
    header += `</div>
    <div align="center"><img src="file:${companyLogo}" width="100" height="100"></div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">Receipt No: ${billInfo.B_Refno}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4">Date: ${formatDate(billInfo.B_OnDate)} ${billInfo.B_CashTime}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4"> Customer: ${billInfo.B_Cust} Cashier: ${billInfo.B_Cashier} Mac:${billInfo.B_MacNo} </font>
      </div>
    </div>`
  let billTable = `
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <th align="center">
            <font face="${fontFamily}" size="4">ETD</font>
          </th>
          <th align="left">
            <font face="${fontFamily}" size="4">Name</font>
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
      if(tSale.R_Void === 'V' || tSale.R_Total === 0 || tSale.R_PluCode=== 'TIPS') {
        if (tSale.R_PluCode=== 'TIPS') {
          tipsItem += `<font face="${fontFamily}" size="4">${truncateWord(tSale.R_PName)} ... ${formatNumber(tSale.R_Total)}</font>`
        }
      }
      billTable += `
        <tr>
          <td align="center">
            <font face="${fontFamily}" size="4">${tSale.R_ETD}</font>
          </td>
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

  const subTotalItems = tSaleInfo.filter(item => item.R_Void !== 'V').length
  
  let htmlContent = `
  <div style="padding: 2px;">
      ${header}
      ${billTable}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Sub-TOTAL....(Item ${subTotalItems})</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Total)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center" style="margin-left: 10px;">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">อาหาร (Food)</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetFood)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">เครื่องดื่ม (Drink)</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDrink)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">สินค้าอื่นๆ (Other)</font>
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
            <td>
              <font face="${fontFamily}" size="4">ค่าบริการ ${formatNumber(billInfo.B_Service)}%</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">มูลค่าสินค้า/บริการ.....</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${(formatNumber(billInfo.B_NetVat - billInfo.B_Vat))}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Vat ${posConfigSetup.P_Vat}%</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Vat)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Net Total</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td>
                <font face="${fontFamily}" size="4">หักคืนเงินมัดจำ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ชำระแบบ Entertain</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Entertain)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินสด</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Cash)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินทอน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Ton)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินโอน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">0.00</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">บัตรเครดิต</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CrAmt1)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดเทศกาล</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_FastDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดพนักงาน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_EmpDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดสมาชิก (VIP)</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_MemDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลด TRAINEE</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_TrainDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดคูปอง</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดบาท</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscBath)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดคูปองพิเศษ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CuponDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดโปรโมชั่น</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ProDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดรายการ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ItemDiscAmt)}</font>
              </td>
            </tr>
          </table>
        </div>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td>
                <font face="${fontFamily}" size="4">สมาชิก</font>
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
                <font face="${fontFamily}" size="4">คะแนนสะสม</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatPoint(billInfo.B_MemCurSum)}</font>
              </td>
            </tr>
          </table>
        </div>
      </div>
      ${footer}
  </div>`

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

  return htmlContent
}

const printReviewReceiptHtml = async ({ macno, tableInfo, balanceInfo }) => {
  const poshwSetup = await getDataByMacno(macno)
  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")

  const tipsTotalAmount = balanceInfo.reduce((sum, item) => {
    return (item.R_PluCode==='TIPS') ? sum + item.R_Total : sum
  }, 0)

  let header = `
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">*** ( ใบตรวจสอบรายการ ไม่ใช่ใบเสร็จรับเงิน ) ***</font>
      </div>
    </div>
    <div align="center">`
    headers.forEach(item => {
      header += `
        <div>
          <font face="${fontFamily}" size="4">${item}</font>
        </div>
      `
    })
    header += `</div>
    <div align="center"><img src="file:${companyLogo}" width="100" height="100"></div>
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">Table: ${tableInfo.Tcode}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4">Date: ${formatDateTime(new Date())}</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4"> Customer: ${tableInfo.TCustomer} Cashier: ${tableInfo.Cashier} Mac:${tableInfo.MacNo} </font>
      </div>
    </div>`
  let billTable = `
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <th align="center">
            <font face="${fontFamily}" size="4">ETD</font>
          </th>
          <th align="left">
            <font face="${fontFamily}" size="4">Name</font>
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
        <td align="center">
          <font face="${fontFamily}" size="4">${balance.R_ETD}</font>
        </td>
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

  const subTotalItems = balanceInfo.filter(item => item.R_Void !== 'V').length

  const htmlContent = `
  <div style="padding: 2px;">
    ${header}
    ${billTable}
    <div align="center">
      <table width="100%">
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Sub-TOTAL....(Item ${subTotalItems})</font>
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
            <font face="${fontFamily}" size="4">อาหาร (Food)</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Food)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">เครื่องดื่ม (Drink)</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.Drink)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">สินค้าอื่นๆ (Other)</font>
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
          <td>
            <font face="${fontFamily}" size="4">ค่าบริการ ${tableInfo.Service}%</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.ServiceAmt)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">มูลค่าสินค้า/บริการ.....</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.TAmount)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Vat ${tableInfo.Vat}%</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.VatAmt)}</font>
          </td>
        </tr>
        <tr>
          <td>
            <font face="${fontFamily}" size="4">Net Total</font>
          </td>
          <td align="right">
            <font face="${fontFamily}" size="4">${formatNumber(tableInfo.NetTotal)}</font>
          </td>
        </tr>
      </table>
    </div>
    <div align="center" style="margin: 5px">
      <font face="${fontFamily}" size="4">Tips ……………${(tipsTotalAmount>0) ? formatNumber(tipsTotalAmount): ""}………………</font>
    </div>
  </div>
  ${footer}
  </div>`

  return htmlContent
}

const printRefundBillHtml = async ({ macno, billInfo, tSaleInfo }) => {
  const posConfigSetup = await getPOSConfigSetup()
  const poshwSetup = await getDataByMacno(macno)
  let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
  headers = headers.filter(h => h !== "")

  let header = `
    <div align="center">
      <div>
        <font face="${fontFamily}" size="4">*** บิลยกเลิกรายการขาย ***</font>
      </div>
      <div>
        <font face="${fontFamily}" size="4">*** (Refund) ***</font>
      </div>
    </div>
    <div align="center">`
    headers.forEach(item => {
      header += `
        <div>
          <font face="${fontFamily}" size="4">${item}</font>
        </div>`
    })
    header += `</div>
    <div align="center"><img src="file:${companyLogo}" width="100" height="100"></div>
    <div align="center">
      <table width="100%" cellPadding="0" cellSpacing="0">
        <tr>
          <td align="left">
            <font face="${fontFamily}" size="4">อ้างถึงใบเสร็จรับเงินเลขที่:</font>
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
            <font face="${fontFamily}" size="4">Void User:</font>
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
          <th align="center">
            <font face="${fontFamily}" size="4">ETD</font>
          </th>
          <th align="left">
            <font face="${fontFamily}" size="4">Name</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Qty</font>
          </th>
          <th align="right">
            <font face="${fontFamily}" size="4">Amount</font>
          </th>
        </tr>`
      tSaleInfo.forEach(tSale => {
        billTable += `
        <tr>
          <td align="center">
            <font face="${fontFamily}" size="4">${tSale.R_ETD}</font>
          </td>
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

  const htmlContent = `
    <div style="padding: 2px;">
      ${header}
      ${billTable}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">Sub-TOTAL....(Item ${tSaleInfo.length})</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Total)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center" style="margin-left: 10px;">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <font face="${fontFamily}" size="4">อาหาร (Food)</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetFood)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">เครื่องดื่ม (Drink)</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetDrink)}</font>
            </td>
          </tr>
          <tr>
            <td>
              <font face="${fontFamily}" size="4">สินค้าอื่นๆ (Other)</font>
            </td>
            <td align="right">
              <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetProduct)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center">
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
                <font face="${fontFamily}" size="4">ค่าบริการ ${billInfo.B_Service}%</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ServiceAmt)}</font>
            </td>
          </tr>
          <tr>
            <td>
                <font face="${fontFamily}" size="4">มูลค่าสินค้า/บริการ.....</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetVat - billInfo.B_Vat)}</font>
            </td>
          </tr>
          <tr>
            <td>
                <font face="${fontFamily}" size="4">Vat ${posConfigSetup.P_Vat}%</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Vat)}</font>
            </td>
          </tr>
          <tr>
            <td>
                <font face="${fontFamily}" size="4">Net Total</font>
            </td>
            <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_NetTotal)}</font>
            </td>
          </tr>
        </table>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td>
                <font face="${fontFamily}" size="4">หักคืนเงินมัดจำ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Earnest)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ชำระแบบ Entertain</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Entertain)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินสด</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Cash)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินทอน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_Ton)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">เงินโอน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">0.00</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">บัตรเครดิต</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CrAmt1)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดเทศกาล</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_FastDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดพนักงาน</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_EmpDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดสมาชิก (VIP)</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_MemDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลด TRAINEE</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_TrainDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดคูปอง</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดบาท</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_SubDiscBath)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดคูปองพิเศษ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_CuponDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดโปรโมชั่น</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ProDiscAmt)}</font>
              </td>
            </tr>
            <tr>
              <td>
                <font face="${fontFamily}" size="4">ส่วนลดรายการ</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatNumber(billInfo.B_ItemDiscAmt)}</font>
              </td>
            </tr>
          </table>
      </div>
      ${Divider}
      <div align="center">
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td>
                <font face="${fontFamily}" size="4">สมาชิก</font>
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
                <font face="${fontFamily}" size="4">คะแนนสะสม</font>
              </td>
              <td align="right">
                <font face="${fontFamily}" size="4">${formatPoint(billInfo.B_MemCurSum)}</font>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    ${footer}
  </div>`

  return htmlContent
}

module.exports = {
  printReceiptHtml,
  printReviewReceiptHtml,
  printRefundBillHtml,
  printReceiptCopyHtml
}
