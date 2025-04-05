const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const { CharacterSet, BreakLine } = require("node-thermal-printer");
const moment = require('moment')
const iconv = require("iconv-lite");
const fs = require('fs')

const { createCanvas } = require('canvas');

const { ASCII2Unicode, Unicode2ASCII } = require('../utils/StringUtil')

const { TOPIC_NAME } = require('../config/kafka/constants');
const kafka = require('../config/kafka/config');

const PRINTER_TYPE = {
    RECEIPT: "receipt",
    COPY: "copy",
    REFUND: "refund",
    CHECK: "check"
}

const sendToKafkaMessage = async data => {
    const producer = kafka.producer()
    const messages = [{ key: "key1", value: data }];
    try {
        await producer.connect();
        await producer.send({
            topic: TOPIC_NAME,
            messages: messages,
        });
    } catch (error) {
        console.error(error);
    } finally {
        await producer.disconnect();
    }
}

const sendToDirectPrinter = async (config, data = {}) => {
    return new Promise((resolve) => {
        // printTest(config)
        resolve('Done')
    })
}

const printTest = (config) => {
    const { printerIp } = config

    return new Promise((resolve) => {
        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `tcp://${printerIp}`, // IP address
            width: 42 // max width of text
        });

        // send to printer
        const data = {
            userId: "user001",
            item: [
                { name: "aaa", quantity: 2, price: 175 },
                { name: "bbb", quantity: 2, price: 175 },
                { name: "ccc", quantity: 1, price: 155 },
                { name: "ddd", quantity: 4, price: 155 }
            ],
            pointBefore: 2634,
            staff: "aaa",
            date: "2022-05-11 18:53:27"
        };

        const printWidth = printer.getWidth();
        const pointAfter =
            data.pointBefore - data.item.reduce((a, b) => a + b.quantity * b.price, 0);
        const totalPoint = data.pointBefore - pointAfter;
        printer.setCharacterSet(CharacterSet.SLOVENIA);
        printer.alignCenter();
        printer.bold(true);
        printer.println('結帳單');
        printer.bold(false);
        printer.alignLeft();
        printer.println(`戶號：${data.userId}`);
        printer.bold(true);
        printer.alignRight();
        printer.println(`品名 * 數量 ($單價) 金額`);
        printer.bold(false);
        data.item.map((e) => {
            printer.println(
                `${e.name} * ${e.quantity} ($${e.price})  $${e.quantity * e.price}`
            );
        });
        printer.println(`合計：$${totalPoint}`);
        printer.alignLeft();
        printer.println(`交易前點數：${data.pointBefore}   交易後點數：${pointAfter}`);
        printer.code128("Code128");                                 // Print code128 bar code
        printer.printQR("QR CODE");                                 // Print QR code
        // await printer.printImage('/Users/tx091511/Documents/Personal/MyMac/softpos-project/softpos-pos-2024/pos-microservice/printer-service/assets/cash.png');
        // await convert(printer, '/Users/tx091511/Documents/Personal/MyMac/softpos-project/softpos-pos-2024/pos-microservice/printer-service/assets/cash.png')
        // printer.beep();
        printer.println(`客服：${data.staff}`);
        printer.println(`總量：(${data.item.length})${data.date}`);
        printer.newLine();
        printer.print('簽名：__________________________');
        printer.cut();

        printer.execute()

        resolve('Done')
    })
}

const printReceipt = (billData, printType, posConfigSetup, poshwSetup, creditList, tSale, memberInfo) => {

    return new Promise(async (resolve, reject) => {
        let printLineData = []

        const NumFormat = data => {
            return data.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")
        }

        let headers = [poshwSetup.Heading1||"", poshwSetup.Heading2||"", poshwSetup.Heading3||"", poshwSetup.Heading4||""]
        headers = headers.filter(h => h !== "")
        let footers = [poshwSetup.Footting1, poshwSetup.Footting2, poshwSetup.Footting3]
        const orderListFilter = tSale.filter(o => o.R_Price > 0)

        printLineData.push({ type: 'align', value: 'center' });
        printLineData.push({ type: 'fontWeight', value: 'bold' });

        // print header
        if (PRINTER_TYPE.COPY === printType) {
            printLineData.push({ type: 'text', value: `Bill Copy (${billData.B_BillCopy})` });
        } else if (PRINTER_TYPE.RECEIPT === printType) {
            printLineData.push({ type: 'text', value: `*** ใบเสร็จรับเงิน ***` });
            headers.forEach(header => {
                printLineData.push({ type: 'text', value: `${header}` });
            })
            printLineData.push({ type: 'text', value: `====== LOGO ======` });
            printLineData.push({ type: 'text', value: `Receipt No: ${billData.B_Refno}` });
            printLineData.push({ type: 'text', value: `Date: ${moment().format('DD/MM/YYYY HH:mm:ss')}` });
            printLineData.push({ type: 'text', value: `Customer: ${billData.B_Cust}` });
            printLineData.push({ type: 'text', value: `Cashier: ${billData.B_Cashier} Employ: ${billData.B_Cashier} Mac: ${billData.B_MacNo}` });
        } else if (PRINTER_TYPE.REFUND === printType) {
            headers.forEach(header => {
                printLineData.push({ type: 'text', value: `${header}` });
            })
            printLineData.push({ type: 'text', value: `====== LOGO =====` });
            printLineData.push({ type: 'text', value: `REG ID: ${billData.B_MacNo}` });
            printLineData.push({ type: 'text', value: `*** บิลยกเลิกการขาย ***` });
            printLineData.push({ type: 'text', value: `*** (Refund) ***` });
            printLineData.push({ type: 'text', value: `Void User: ${billData.B_VoidUser}` });
            printLineData.push({ type: 'text', value: `Void Date/Time: ${billData.B_VoidTime}` });
            printLineData.push({ type: 'text', value: `อ้างถึงใบเสร็จรับเงินเลขที่: ${billData.B_Refno}` });
        }
        printLineData.push({ type: 'text', value: '__________________________' });
        printLineData.push({ type: 'fontWeight', value: 'plain' });
        orderListFilter.map(e => {
            if (e.R_Void !== 'V') {
                printLineData.push({
                    type: 'text', value: `[${e.R_ETD}] ${e.R_PName} * ${e.R_Quan} (${NumFormat(e.R_Price)})  ${NumFormat(e.R_Quan * e.R_Price)}`
                });
            } else if (e.R_Void === 'V') {
                printLineData.push({
                    type: 'text', value: `[${e.R_ETD}] ${e.R_PName} * ${e.R_Quan} (${NumFormat(e.R_Price)})  ${0.00} (ยกเลิก)`
                });
            }
        });
        printLineData.push({ type: 'text', value: '__________________________' });

        printLineData.push({ type: 'align', value: 'left' });
        printLineData.push({ type: 'text', value: `Sub-TOTAL....(Item ${orderListFilter.filter(item => item.R_Void !== 'V').length}) ${NumFormat(billData.B_Total)}` });
        printLineData.push({ type: 'text', value: `  อาหาร (Food)    ${NumFormat(billData.B_NetFood)}` });
        printLineData.push({ type: 'text', value: `  เครื่องดื่ม (Drink) ${NumFormat(billData.B_NetDrink)}` });
        printLineData.push({ type: 'text', value: `  สินค้าอื่นๆ (Other) ${NumFormat(billData.B_NetProduct)}` });

        printLineData.push({ type: 'text', value: `ค่าบริการ ${posConfigSetup.P_Service}% ${NumFormat(billData.B_ServiceAmt)}` });
        printLineData.push({ type: 'text', value: `มูลค่าสินค้า/บริการ..... ${NumFormat((billData.B_NetVat - billData.B_Vat))}` });
        printLineData.push({ type: 'text', value: `Vat ${posConfigSetup.P_Vat}%  ${billData.B_Vat}` });
        printLineData.push({ type: 'text', value: `Net Total ${NumFormat(billData.B_NetTotal)}` });
        printLineData.push({ type: 'text', value: `ค่ามัดจำ ${NumFormat(billData.B_Earnest)}` });
        printLineData.push({ type: 'text', value: `ค่า Entertain ${NumFormat(billData.B_Entertain)}` });

        creditList.forEach(item => {
            printLineData.push({ type: 'text', value: `${item.CrCode} ${item.CardNo}` });
            printLineData.push({ type: 'text', value: `CR_Charge ${item.CrCharge} ${NumFormat(item.CrChargeAmount)} ${NumFormat(item.CrAmt)}` });
        })

        printLineData.push({ type: 'text', value: `เงินสด ${NumFormat(billData.B_Cash)}` });
        printLineData.push({ type: 'text', value: `เงินทอน ${NumFormat(billData.B_Ton)}` });
        printLineData.push({ type: 'newline', value: 1 });
        printLineData.push({ type: 'text', value: `${posConfigSetup.P_PrintRecpMessage}` });
        printLineData.push({ type: 'text', value: '__________________________' });

        if (billData.B_MemCode) {
            printLineData.push({ type: 'text', value: `เลขที่สมาชิก: ${billData.B_MemCode} ${billData.B_MemName}` });
            printLineData.push({ type: 'text', value: `ยอดซื้อสะสม: ${memberInfo.Member_TotalPurchase}` });
            printLineData.push({ type: 'text', value: `คะแนนสะสม: ${memberInfo.Member_TotalScore}` });
            printLineData.push({ type: 'text', value: '__________________________' });
        }

        footers.forEach(item => {
            printLineData.push({ type: 'text', value: `${item}` });
        })
        printLineData.push({ type: 'newline', value: 1 });
        printLineData.push({ type: 'qrcode', value: billData.B_Refno });
        printLineData.push({ type: 'text', value: '__________________________' });

        printLineData.push({ type: 'newline', value: 1 });
        printLineData.push({ type: 'printer', value: 'cut' });

        // printLineData.forEach(item => {
        //     if (item.type === 'text') {
        //         console.log(item.value)
        //     }
        // })

        resolve(printLineData)
    })
}

const getExecutePrinter = (printer, printData) => {
    return new Promise(async (resolve, reject) => {
        // const printWidth = printer.getWidth();
        // console.log('printWidth:', printWidth);

        printData.forEach(async item => {
            if (item.type === 'text') {
                printer.println(item.value);
            }
            if (item.type === 'align') {
                if (item.value === 'center') {
                    printer.alignCenter();
                }
                if (item.value === 'right') {
                    printer.alignRight();
                }
                if (item.value === 'left') {
                    printer.alignLeft();
                }
            }
            if (item.type === 'qrcode') {
                printer.printQR(item.value)
            }
            if (item.type === 'newline') {
                printer.newLine()
            }
            if (item.type === 'fontWeight') {
                if (item.value === 'bold') {
                    printer.bold(true)
                }
                if (item.value === 'plain') {
                    printer.bold(false)
                }
            }
            if (item.type === 'printer') {
              if(item.value === 'cut'){
                printer.cut()
              }
            }
        })

        resolve(printer)
    })
}

const demoPrint = (printer) => {
  printer.tableCustom([                                       // Prints table with custom settings (text, align, width, cols, bold)
    { text:"Left", align:"LEFT", width:0.5 },
    { text:"Center", align:"CENTER", width:0.25, bold:true },
    { text:"Right", align:"RIGHT", cols:8 }
  ]);
  printer.println("Test Printer 01")
  printer.raw("ทดสอบภาษาไทย:1")
  printer.raw(Unicode2ASCII("ทดสอบภาษาไทย:2"))
  printer.raw(ASCII2Unicode("ทดสอบภาษาไทย:3"))
  printer.raw(iconv.encode("ทดสอบภาษาไทย:4", 'TIS-620'))
  printer.raw(iconv.encode("ทดสอบภาษาไทย:5", 'UTF-8'))
  printer.raw(iconv.encode("ทดสอบภาษาไทย:6", 'windows-874'))
  printer.raw("Test Printer 02")
  printer.cut()
  printer.execute()
}

async function printThaiWithBitmap(printer) {
  try {
      // สร้าง Canvas และพิมพ์ข้อความภาษาไทย
      const canvas = createCanvas(300, 80);  // ขนาด Canvas
      const ctx = canvas.getContext('2d');
      
      // เลือกฟอนต์ที่รองรับภาษาไทย (ฟอนต์ที่มีในระบบหรือที่ติดตั้ง)
      ctx.font = '16px "Arial"';  // ใช้ฟอนต์ Arial หรือฟอนต์ที่คุณต้องการ
      ctx.fillText("Test Printing Text IMage", 10, 40);  // พิมพ์ข้อความที่ต้องการ

      // แปลงภาพเป็น Buffer (Bitmap)
      const buffer = canvas.toBuffer('image/png');  // เปลี่ยนเป็น Buffer ในรูปแบบ PNG
      const imageBuffer = fs.writeFileSync('example.png', buffer);

      // สั่งให้พรินเตอร์พิมพ์ภาพ
      await printer.printImage('example.png');
      
      // พิมพ์การตัดกระดาษ
      printer.cut();
      await printer.execute();
  } catch (error) {
      console.error("เกิดข้อผิดพลาดในการพิมพ์:", error);
  }
}

const printReceiptProcess = (config, billData, printType, posConfigSetup, poshwSetup, creditList, tSale, memberInfo) => {
    const { printerIp } = config

    return new Promise(async (resolve, reject) => {
        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `tcp://${printerIp}`,
            width: 42,
            removeSpecialCharacters: false,
            lineCharacter: "=",
            breakLine: BreakLine.WORD,
            characterSet: CharacterSet.PC852_LATIN2
        });

        try {
            // generate data
            const printData = await printReceipt(billData, printType, posConfigSetup, poshwSetup, creditList, tSale, memberInfo)
            const isConnected = await printer.isPrinterConnected();
            if (!isConnected) return reject('unConnected!');

            // send to printer
            // demoPrint(printer)
            // await printThaiWithBitmap(printer)
            getExecutePrinter(printer, printData)
                .then(printer => {
                    printer.execute()
                })

            // update bill print database
            resolve('Done')
        } catch (error) {
            reject(error.message)
        }
    })
}

module.exports = {
    sendToKafkaMessage,
    sendToDirectPrinter,
    printTest,
    printReceiptProcess
}
