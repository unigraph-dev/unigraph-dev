const { app, BrowserWindow } = require('electron')
const path = require('path')
const { exec } = require("child_process");

exec(path.join(__dirname, '..', 'dgraph', 'dgraph') + " alpha")
exec(path.join(__dirname, '..', 'dgraph', 'dgraph') + " zero")

setTimeout(() => require(path.join(__dirname, '..', 'distnode', 'index.js')), 5000)



function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js')
    }
  })

  win.loadFile(path.join(__dirname, '..', 'build', 'index.html'))
}

app.whenReady().then(() => {
  setTimeout(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  }, 5000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})