const { app, BrowserWindow, Menu, Tray, nativeImage, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require("child_process");
const { fixPathForAsarUnpack } = require('electron-util');
const { ipcMain } = require('electron');
const { createTrayMenu } = require('./tray')

const Store = require('electron-store');
var net = require('net');

const store = new Store();

const userData = app.getPath('userData')

const unigraph_trayIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAADiXRFWHRteGZpbGUAJTNDbXhmaWxlJTIwaG9zdCUzRCUyMmFwcC5kaWFncmFtcy5uZXQlMjIlMjBtb2RpZmllZCUzRCUyMjIwMjEtMDUtMDNUMTclM0EwNiUzQTA5LjUxMlolMjIlMjBhZ2VudCUzRCUyMjUuMCUyMChNYWNpbnRvc2glM0IlMjBJbnRlbCUyME1hYyUyME9TJTIwWCUyMDExXzNfMCklMjBBcHBsZVdlYktpdCUyRjUzNy4zNiUyMChLSFRNTCUyQyUyMGxpa2UlMjBHZWNrbyklMjBDaHJvbWUlMkY4OC4wLjQzMjQuMTUwJTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwZXRhZyUzRCUyMmFKRldEQUR0MlEzVk5fZVpKd3I0JTIyJTIwdmVyc2lvbiUzRCUyMjE0LjYuOSUyMiUyMHR5cGUlM0QlMjJkZXZpY2UlMjIlM0UlM0NkaWFncmFtJTIwaWQlM0QlMjJCV0JHLVBoeFRTZkFxRlZBOTdhRSUyMiUyMG5hbWUlM0QlMjJQYWdlLTElMjIlM0VqWkxCYm9Nd0RJYWZobU1sS0czSGpvTjEzV1hTcXFyck9TSXVpUnBpRkVLaGUlMkZxWmtaU3lxdEl1eVA1c3glMkJhM2d6Z3J1NDFobGZoQURpcVloN3dMNHRkZ1BuOWVyT2piZzhzQWxxdkZBQW9qJTJCWUNpRWV6a056Z1lPdHBJRHZVazBTSXFLNnNwekZGcnlPMkVNV093bmFZZFVVMjdWcXlBTzdETG1icW5COG10R0dpeURFZiUyQkRySVF2bk1VdWtqSmZMSUR0V0FjMnhzVXI0TTRNNGgyc01vdUE5VnI1M1VaNnQ0ZVJLJTJCREdkRDJQd1d6elZjaW5qNlhNamx2RDlYMnhMcDRQM092bkpscTNBJTJGdjNiVDI0aVd3MEZHRFZOaFNFWWpJckszQkUyU28wQkRScUNrelBVcWwlMkZpQ21aS0hKeldsRUlKNmV3VmhKNHI2NFFDazU3OXVrclpBV2RoWEwlMkI1NHRYUkl4ZzQzbTBFOGZrdWNHcFFlZ2U2aEFkTldWN2hHd0JHc3VsTktPbSUyRlBiRURkTDg0eTVXeW11bGFPY1pEaEZ2VHR1N2pkMmMlMkY3eCUyQmdjJTNEJTNDJTJGZGlhZ3JhbSUzRSUzQyUyRm14ZmlsZSUzRQ4QufQAAACnSURBVDhP7dQxDgFREIDhb1vR6PTEFbiCOARX4ABKxyERdGqJG0hwBAWFREM22WIRu2vZbl/yqjfvn8k/mQkUcIICmEro/60mOe1ixZv3OfYYfSonCdrDooS+KvrJaQcbVHCNNWWN8E7yNKqGE9rYxgBn9DHLAw3/7HDAADcMMUYDx7zQJpZoRYBLlGCaNDJZF0od1ajqe9oMZoWmcZ7eS+hXujIFPwCUDCEWIOzIUgAAAABJRU5ErkJggg=="

const frontendLocation = process.env.FRONTEND_LOCATION || "localhost";

let logs = [];
let mainWindow = null;
let todayWindow = null;
let omnibar = null;
let tray = null;
let trayMenu = null;
let index = null;
let dontCheck = false;
let shouldStartBackend = true;
let alpha, zero;

let mainWasVisible = false;
let mainWasFocused = false;

if (process.env.FRONTEND_LOCATION) shouldStartBackend = false;

function isDev() {
  return process.argv[2] == '--dev';
}

function isUnigraphPortOpen(port) {
  return new Promise((resolve, reject) => {
    var server = net.createServer(function (socket) {
      socket.write('Echo server\r\n');
      socket.pipe(socket);
    });
    server.listen(port, '127.0.0.1');
    server.on('error', function (e) {
      resolve(true);
    });
    server.on('listening', function (e) {
      server.close();
      resolve(false);
    });
  })
}

async function startServer(logHandler) {
  console.log("Starting server - checking is port open?")
  const portopen = await isUnigraphPortOpen(3000);
  console.log(portopen, fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), path.join(userData, 'w'), store.get('startServer') !== false)
  if (store.get('startServer') !== false && !portopen && shouldStartBackend) {
    let oldConsoleLog = console.log;
    console.log = (data) => { 
      if (!Array.isArray(data)) data = [data];
      logs.push(...data); 
      if (!dontCheck) checkIfUComplete(...data); 
      logHandler.send('loading_log', logs)
      return oldConsoleLog(...data) }
    alpha = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), ["alpha", '--wal', path.join(userData, 'w'), '--postings', path.join(userData, 'p')])
    zero = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), ["zero", '--wal', path.join(userData, 'zw')])

    let completedLog = "ResetCors closed" // When this is logged we know it's completed
    let completedULog = "Unigraph server listening on port"

    function checkIfComplete(str) {
      if (str.includes && str.includes(completedLog)) dgraphLoaded();
    }

    function checkIfUComplete(str) {
      if (str.includes && str.includes(completedULog)) unigraphLoaded();
    }

    function processData(data, header) {
      console.log(header + ': ' + data.toString());
      checkIfComplete(data.toString())
    }

    alpha.stdout.on('data', (data) => processData(data, "alpha_stdout"));
    alpha.stderr.on('data', (data) => processData(data, "alpha_stderr"));
    zero.stdout.on('data', (data) => processData(data, "zero_stdout"));
    zero.stderr.on('data', (data) => processData(data, "zero_stderr"));

  } else {
    unigraphLoaded();
  }
}

function createMainWindow(props) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nativeWindowOpen: true,
      contextIsolation: false,
    },
    ...(props ? props : { titleBarStyle: "hiddenInset" })
  })

  //if (mainPage) win.loadFile(path.join(__dirname, '..', 'buildweb', mainPage))

  return win;
}

function createLoadingWindow(props) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nativeWindowOpen: true,
      contextIsolation: false,
    },
    ...(props ? props : { titleBarStyle: "hiddenInset" })
  })

  win.loadFile(path.join(__dirname, '..', 'buildweb', 'loading_bar.html'))

  return win;
}

const createTodayWindow = () => createMainWindow({
  transparent: true,
  frame: false,
  backgroundColor: '#00ffffff'
});

const createOmnibar = () => createMainWindow({
  transparent: true,
  frame: false,
  backgroundColor: '#00ffffff',
  skipTaskbar: true,
  useContentSize: true,
  webPreferences: {
    preload: path.join(__dirname, '..', 'src', 'preload_omnibar.js'),
    nativeWindowOpen: true,
    contextIsolation: false,
  }
});

const createMainWindowNoLoad = () => createMainWindow(null)

function dgraphLoaded() {
  index = require(path.join(__dirname, '..', 'distnode', 'index.js'))
}

function unigraphLoaded() {
  dontCheck = true;
  setTimeout(() => {
    if (mainWindow) {
      if (!isDev()) {
        mainWindow.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'))
      } else {
        mainWindow.loadURL('http://' + frontendLocation + ':3000/')
      }
    }
    if (todayWindow) {
      //!isDev() ?
        //todayWindow.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'), { query: { "pageName": "today" } }) :
        //todayWindow.loadURL('http://' + frontendLocation + ':3000/?pageName=today');
      //todayWindow.hide();
    }
    if (omnibar) {
      !isDev() ?
        omnibar.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'), { query: { "pageName": "omnibar" } }) :
        omnibar.loadURL('http://' + frontendLocation + ':3000/?pageName=omnibar'); 
      omnibar.hide();
    }
  }, 0)
}

let isAppClosing = false;

app.whenReady().then(() => {
  tray = new Tray(nativeImage.createFromDataURL(unigraph_trayIcon))
  tray.setToolTip('Unigraph')
  trayMenu = createTrayMenu((newTemplate) => { tray.setContextMenu(Menu.buildFromTemplate(newTemplate)) });
  globalShortcut.register('Alt+Tab', () => {
    if (todayWindow) {
      //todayWindow.isVisible() ? todayWindow.hide() : todayWindow.show();
    };
  });
  globalShortcut.register('CommandOrControl+E', () => {
    if (omnibar) {
      omnibar.isVisible() ? closeOmnibar() : showOmnibar();
    };
  })
  setTimeout(() => {
    mainWindow = createLoadingWindow()//, todayWindow = createTodayWindow()
    omnibar = createOmnibar();
    omnibar.on('blur', () => {
      //console.log("buhf")
      closeOmnibar();
    })
    //todayWindow.maximize();
    mainWindow.maximize();
    //todayWindow.setVisibleOnAllWorkspaces(true);
    omnibar.setVisibleOnAllWorkspaces(true);
    trayMenu.setMainWindow(mainWindow)//, trayMenu.setTodayWindow(todayWindow)
    startServer(mainWindow.webContents);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindowNoLoad()
      }
      if (mainWindow) {
        mainWindow.show();
      }
    })
    const windows = [mainWindow, omnibar]
    windows.map(el => el.on('close', (event) => {
      if (!isAppClosing) {
        event.preventDefault();
        el.hide();
      }
    }))
    windows.map(el => el.on('hide', (event) => {

    }))
  }, 0)
})

ipcMain.on('favorites_updated', (event, args) => {
  if (trayMenu) trayMenu.setFavorites(args)
})
//const applescript = require('applescript');

function closeOmnibar () {
  if (!mainWasFocused && process.platform === "darwin") {
    console.log("hi")
    mainWindow.setFocusable(false);
    //todayWindow.setFocusable(false);
    omnibar.hide();
    mainWindow.setFocusable(true);
    //todayWindow.setFocusable(true);
  } else {
    omnibar.hide();
  }
}

ipcMain.on('newTabByUrl', (event, args) => {
  mainWindow.webContents.send('newTabByUrl', args);
  mainWindow.show();
})
//const applescript = require('applescript');

function showOmnibar () {
  mainWasFocused = mainWindow.isFocused();
  mainWasVisible = mainWindow.isVisible();
  console.log(mainWasFocused, process.platform)
  omnibar.show();
}

ipcMain.on('close_omnibar', closeOmnibar)

app.on('window-all-closed', () => {
  // Prevent app quitting
})

app.on('quit', () => {
  if (alpha) alpha.kill();
  if (zero) zero.kill();
})

app.on('will-quit', async function (e) {
  var choice = await require('electron').dialog.showMessageBox({
    type: 'question',
    buttons: ['Quit', 'Minimize to Tray'],
    title: 'Confirm',
    message: 'Unigraph can minimize to tray. It consumes minimal battery and can help you manage your knowledge more quickly (for example, instant access to your information).'
  })
  if (choice.response === 1) {
    e.preventDefault();
  }
});

app.on('before-quit', function () {
  isAppClosing = true;
});