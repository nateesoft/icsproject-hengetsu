const puppeteer = require('puppeteer');
const fs = require('fs');

const testWritePDF = async () => {
  const browser = await puppeteer.launch(); // ใช้ `{ headless: true }` ได้
  const page = await browser.newPage();

  // HTML เนื้อหาของคุณ
  const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Tahoma', sans-serif; font-size: 14pt; }
              h1 { color: #007bff; }
            </style>
          </head>
          <body>
            <h1>สวัสดี!</h1>
            <p>นี่คือ PDF ที่สร้างจาก HTML ด้วย Puppeteer</p>
          </body>
        </html>
      `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // สร้าง PDF
  await page.pdf({
    path: 'output.pdf',
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  console.log('PDF created: output.pdf');
}

const savePdfFile = async (htmlContent, filePath) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // สร้าง PDF
  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  console.log(`PDF created: ${filePath}`);
}

module.exports = {
  testWritePDF,
  savePdfFile
}
