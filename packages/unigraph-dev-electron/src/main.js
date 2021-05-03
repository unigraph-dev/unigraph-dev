const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const { spawn } = require("child_process");
const { fixPathForAsarUnpack } = require('electron-util');

const userData = app.getPath('userData')

let logs = [];
let mainWindow = null;

let oldConsoleLog = console.log;
console.log = (...data) => { logs.push(...data); checkIfUComplete(...data); return oldConsoleLog(...data) }

let alpha = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), ["alpha", '--wal', path.join(userData, 'w'), '--postings', path.join(userData, 'p')])
let zero = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), ["zero", '--wal', path.join(userData, 'zw')])

let completedLog = "ResetCors closed" // When this is logged we know it's completed
let completedULog = "Unigraph server listening on port"

function checkIfComplete(str) {
  if (str.includes && str.includes(completedLog)) dgraphLoaded();
}

function checkIfUComplete(str) {
  if (str.includes && str.includes(completedULog)) unigraphLoaded();
}

alpha.stdout.on('data', function (data) {
  console.log('alpha_stdout: ' + data.toString());
  checkIfComplete(data.toString())
});

zero.stdout.on('data', function (data) {
  console.log('zero_stdout: ' + data.toString());
  checkIfComplete(data.toString())
});

alpha.stderr.on('data', function (data) {
  console.log('alpha_stderr: ' + data.toString());
  checkIfComplete(data.toString())
});

zero.stderr.on('data', function (data) {
  console.log('zero_stderr: ' + data.toString());
  checkIfComplete(data.toString())
});

function createMainWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nativeWindowOpen: true
    }
  })

  win.loadFile(path.join(__dirname, '..', 'buildweb', 'loading_bar.html'))

  return win;
}

function createMainWindowNoLoad() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nativeWindowOpen: true
    }
  })

  win.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'))

  return win;
}

function dgraphLoaded() {
  let index = require(path.join(__dirname, '..', 'distnode', 'index.js'))
}

function unigraphLoaded() {
  if (mainWindow) mainWindow.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'))
}

app.whenReady().then(() => {
  tray = new Tray(nativeImage.createEmpty())
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' }
  ])
  tray.setToolTip('Unigraph')
  tray.setContextMenu(contextMenu)
  setTimeout(() => {
    mainWindow = createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindowNoLoad()
      }
    })
  }, 0)
})

app.on('window-all-closed', () => {
  // Prevent app quitting
})

app.on('quit', () => {
  alpha.kill();
  zero.kill();
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