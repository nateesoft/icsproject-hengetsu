const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const logger = require('morgan');
const basicAuth = require('express-basic-auth')
const compression = require("compression");
const helmet = require("helmet");

const cors = require('cors')

// for Restaurant POS (old)
// login
const posuserRouter = require('./routes/pos_restaurant/login/posuser');
const employRouter = require('./routes/pos_restaurant/login/employ');

const poshwsetupRouter = require('./routes/pos_restaurant/config/poshwsetup');

// order
const tableFileRouter = require('./routes/pos_restaurant/order/TableFile');
const balanceRouter = require('./routes/pos_restaurant/order/Balance');
const billNoRouter = require('./routes/pos_restaurant/order/BillNo');
const tSaleRouter = require('./routes/pos_restaurant/order/TSale');
const posProductRouter = require('./routes/pos_restaurant/product/Product');
const posGroupFileRouter = require('./routes/pos_restaurant/product/GroupFile');
const optionFileRouter = require('./routes/pos_restaurant/optionfile');
const voidMsgRouter = require('./routes/pos_restaurant/order/VoidMsg');
const creditFileRouter = require('./routes/pos_restaurant/order/CreditFile');
const genQrCode = require('./routes/payment/qrcode_promptpay')

// for New POS apis
const floorplanRouter = require('./routes/floorplan/floorplan');
const floorplanTemplateRouter = require('./routes/floorplan/floorplan_template');
const menuSetupRouter = require('./routes/pos/menu_setup');
const menuTabsRouter = require('./routes/pos/menu_tabs');
const tableCheckInRouter = require('./routes/pos/tableCheckIn');
const posSettingRouter = require('./routes/pos/pos_setting');
const overviewReportRouter = require('./routes/pos/report');

// for CRM POS
const memmasterRouter = require('./routes/member/crm/Memmaster');

// for Customer Orsder
const customerOrderRouter = require('./routes/customer')

// for printer thermal
const printerThermalRouter = require('./routes/printer')();
const reportRouter = require('./routes/report');

// process stock
const processStockRouter = require('./routes/pos_restaurant/stock/processStock')
const stkFileRouter = require('./routes/pos_restaurant/stock/stkfile')
const stcardRouter = require('./routes/pos_restaurant/stock/stcard')

// pos config
const posConfigSetup = require('./routes/pos_restaurant/config/posconfigsetup')
const posHwSetup = require('./routes/pos_restaurant/config/poshwsetup')
const company = require('./routes/pos_restaurant/config/company')
const cupon = require('./routes/pos_restaurant/config/cupon')
const giftvoucher = require('./routes/pos_restaurant/config/giftvoucher')
const branch = require('./routes/pos_restaurant/config/branch')

const invenotryDbRouter = require('./routes/inventory')

// paid-in, paid-out
const paidInOutRouter = require('./routes/pos_restaurant/padinout')

// booking interation
const bookingRouter = require('./routes/api_integration')

const app = express()
app.use(cors())
app.use(compression())
app.use(helmet());

const username = process.env.WEB_USER_AUTH
const password = process.env.WEB_USER_PASS
// app.use(basicAuth({ users: { [username]: password } }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// handle error mysql disconnect
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive')
  next()
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/version', (req, res) => {
  res.json({
    version: "0.0.0"
  })
})

app.use('/api/floorplan', floorplanRouter);
app.use('/api/floorplan-template', floorplanTemplateRouter);

app.use('/api/posuser', posuserRouter);
app.use('/api/tablefile', tableFileRouter);
app.use('/api/employ', employRouter);
app.use('/api/poshwsetup', poshwsetupRouter);

app.use('/api/pos-product', posProductRouter);
app.use('/api/pos-groupfile', posGroupFileRouter);
app.use('/api/balance', balanceRouter);
app.use('/api/tablefile', tableFileRouter);
app.use('/api/billno', billNoRouter);
app.use('/api/tsale', tSaleRouter);
app.use('/api/qr-payment', genQrCode);

// new posdb
app.use('/api/menu_setup', menuSetupRouter);
app.use('/api/menu_tabs', menuTabsRouter);
app.use('/api/table_checkin', tableCheckInRouter);
app.use('/api/pos_setting', posSettingRouter);
app.use('/api/overview-report', overviewReportRouter);

app.use('/api/optionfile', optionFileRouter);
app.use('/api/voidmsg', voidMsgRouter);
app.use('/api/creditfile', creditFileRouter);
app.use('/api/process-stock', processStockRouter);
app.use('/api/stkfile', stkFileRouter);
app.use('/api/stcard', stcardRouter);
app.use('/api/posconfigsetup', posConfigSetup);
app.use('/api/poshwsetup', posHwSetup);
app.use('/api/company', company);
app.use('/api/cupon', cupon);
app.use('/api/giftvoucher', giftvoucher);
app.use('/api/branch', branch);
app.use('/api/paidinout', paidInOutRouter)

// support load all table
app.use('/api/inventory', invenotryDbRouter)

// crm member
app.use('/api/crm/member', memmasterRouter)

// customer order
app.use('/api/customer', customerOrderRouter)

// route for test printer
app.use('/api/printer-thermal', printerThermalRouter)
app.use('/api/report', reportRouter)

// booking integration
app.use('/api/integration', bookingRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('uncaughtException', err => {
  console.error(err.stack)
})

module.exports = app;
