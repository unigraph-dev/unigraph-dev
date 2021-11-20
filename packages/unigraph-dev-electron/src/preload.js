window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })

const { ipcRenderer, shell } = require('electron');

window.electronPreload = () => {
  window.electronShell = shell;
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

ipcRenderer.on('loading_log', (event, newLog) => {
  if (document.getElementById('loading_log')) {
    document.getElementById('loading_log').innerHTML = newLog.slice(-10).join('\n')
  }
})