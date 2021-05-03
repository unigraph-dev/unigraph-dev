const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require("child_process");
const { fixPathForAsarUnpack } = require('electron-util');

const userData = app.getPath('userData')

let alpha = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')),  ["alpha", '--wal', path.join(userData, 'w'), '--postings', path.join(userData, 'p')])
let zero = spawn(fixPathForAsarUnpack(path.join(__dirname, '..', 'dgraph', 'dgraph')), ["zero", '--wal', path.join(userData, 'zw')])

let completedLog = "ResetCors closed" // When this is logged we know it's completed

function checkIfComplete (str) {
  if (str.includes && str.includes(completedLog)) dgraphLoaded();
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

function createMainWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      nativeWindowOpen: true
    }
  })

  win.loadFile(path.join(__dirname, '..', 'buildweb', 'index.html'))
}

function dgraphLoaded () {
  let index = require(path.join(__dirname, '..', 'distnode', 'index.js'))

  app.whenReady().then(() => {
    setTimeout(() => {
      createMainWindow()
  
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow()
        }
      })
    }, 5000)
  })
  
  
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  alpha.kill();
  zero.kill();
})