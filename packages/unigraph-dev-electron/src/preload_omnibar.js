const { ipcRenderer, shell } = require('electron');

window.electronPreload = () => {
    window.electronShell = shell;
    window.wsnavigator = (newUrl) => ipcRenderer.send("newTabByUrl", newUrl);
    window.setClose = () => ipcRenderer.send("close_omnibar");
}