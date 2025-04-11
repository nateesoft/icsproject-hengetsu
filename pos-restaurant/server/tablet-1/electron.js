const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // ตรวจสอบโหมด DEV หรือ PRODUCTION
  const isDev = false //!app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000"); // โหลดจาก React Dev Server
  } else {
    const fullPathApp = path.join(__dirname, "build", "index.html")
    console.log(fullPathApp)
    mainWindow.loadFile(fullPathApp);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
