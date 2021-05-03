const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const { spawn } = require("child_process");
const { fixPathForAsarUnpack } = require('electron-util');

const userData = app.getPath('userData')

const unigraph_trayIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAADiXRFWHRteGZpbGUAJTNDbXhmaWxlJTIwaG9zdCUzRCUyMmFwcC5kaWFncmFtcy5uZXQlMjIlMjBtb2RpZmllZCUzRCUyMjIwMjEtMDUtMDNUMTclM0EwNiUzQTA5LjUxMlolMjIlMjBhZ2VudCUzRCUyMjUuMCUyMChNYWNpbnRvc2glM0IlMjBJbnRlbCUyME1hYyUyME9TJTIwWCUyMDExXzNfMCklMjBBcHBsZVdlYktpdCUyRjUzNy4zNiUyMChLSFRNTCUyQyUyMGxpa2UlMjBHZWNrbyklMjBDaHJvbWUlMkY4OC4wLjQzMjQuMTUwJTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwZXRhZyUzRCUyMmFKRldEQUR0MlEzVk5fZVpKd3I0JTIyJTIwdmVyc2lvbiUzRCUyMjE0LjYuOSUyMiUyMHR5cGUlM0QlMjJkZXZpY2UlMjIlM0UlM0NkaWFncmFtJTIwaWQlM0QlMjJCV0JHLVBoeFRTZkFxRlZBOTdhRSUyMiUyMG5hbWUlM0QlMjJQYWdlLTElMjIlM0VqWkxCYm9Nd0RJYWZobU1sS0czSGpvTjEzV1hTcXFyck9TSXVpUnBpRkVLaGUlMkZxWmtaU3lxdEl1eVA1c3glMkJhM2d6Z3J1NDFobGZoQURpcVloN3dMNHRkZ1BuOWVyT2piZzhzQWxxdkZBQW9qJTJCWUNpRWV6a056Z1lPdHBJRHZVazBTSXFLNnNwekZGcnlPMkVNV093bmFZZFVVMjdWcXlBTzdETG1icW5COG10R0dpeURFZiUyQkRySVF2bk1VdWtqSmZMSUR0V0FjMnhzVXI0TTRNNGgyc01vdUE5VnI1M1VaNnQ0ZVJLJTJCREdkRDJQd1d6elZjaW5qNlhNamx2RDlYMnhMcDRQM092bkpscTNBJTJGdjNiVDI0aVd3MEZHRFZOaFNFWWpJckszQkUyU28wQkRScUNrelBVcWwlMkZpQ21aS0hKeldsRUlKNmV3VmhKNHI2NFFDazU3OXVrclpBV2RoWEwlMkI1NHRYUkl4ZzQzbTBFOGZrdWNHcFFlZ2U2aEFkTldWN2hHd0JHc3VsTktPbSUyRlBiRURkTDg0eTVXeW11bGFPY1pEaEZ2VHR1N2pkMmMlMkY3eCUyQmdjJTNEJTNDJTJGZGlhZ3JhbSUzRSUzQyUyRm14ZmlsZSUzRQ4QufQAAACnSURBVDhP7dQxDgFREIDhb1vR6PTEFbiCOARX4ABKxyERdGqJG0hwBAWFREM22WIRu2vZbl/yqjfvn8k/mQkUcIICmEro/60mOe1ixZv3OfYYfSonCdrDooS+KvrJaQcbVHCNNWWN8E7yNKqGE9rYxgBn9DHLAw3/7HDAADcMMUYDx7zQJpZoRYBLlGCaNDJZF0od1ajqe9oMZoWmcZ7eS+hXujIFPwCUDCEWIOzIUgAAAABJRU5ErkJggg=="

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
  tray = new Tray(nativeImage.createFromDataURL(unigraph_trayIcon))
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