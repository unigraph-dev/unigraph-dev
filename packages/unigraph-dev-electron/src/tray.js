const { ipcMain } = require('electron');

const createTrayMenu = (onNewTemplate) => {
    let mainWindow;
    let searchWindow;

    const menuTemplateMain = [
        {
            label: 'Show main window',
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: 'Show search bar',
            click: () => {
                searchWindow.show();
                searchWindow.webContents.send('showOmnibar');
            },
        },
    ];
    let menuTemplateFavorites = [];

    let menuTemplate = [];

    function setTemplate() {
        menuTemplate = [
            { label: 'Unigraph', enabled: false },
            ...menuTemplateMain,
            { type: 'separator' },
            { label: 'Favorites', enabled: false },
            ...menuTemplateFavorites,
        ];
        console.log(menuTemplate);
        onNewTemplate(menuTemplate);
    }

    setTemplate();

    return {
        getTemplate: () => menuTemplate,
        setFavorites: (newFav) => {
            menuTemplateFavorites = newFav.map((el) => {
                return {
                    click: () => {
                        mainWindow.webContents.send('newTab', el);
                        mainWindow.show();
                    },
                    type: 'normal',
                    label: el.name,
                };
            });
            setTemplate();
        },
        setMainWindow: (window) => {
            mainWindow = window;
        },
        setSearchWindow: (window) => {
            searchWindow = window;
        },
    };
};

module.exports = { createTrayMenu };
