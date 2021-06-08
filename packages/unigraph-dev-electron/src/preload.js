window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })

window.electronPreload = () => {
  const { ipcRenderer } = require('electron')
  let unigraph = window.unigraph;
  unigraph.addState('favorites', []).subscribe((newFavs) => {
    ipcRenderer.send("favorites_updated", newFavs);
  })
  ipcRenderer.on('newTab', (event, tab) => {
    window.newTab(window.layoutModel, {
      type: 'tab',
      config: tab.config,
      name: tab.name,
      component: tab.component,
      enableFloat: 'true'
  })
  })

}