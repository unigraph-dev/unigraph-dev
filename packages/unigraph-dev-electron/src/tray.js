const { ipcMain } = require('electron');

const createTrayMenu = (onNewTemplate) => {
    let mainWindow;
    let todayWindow;

    const menuTemplateMain = [
        { label: 'Show main window' },
        { label: 'Show today window', click: () => todayWindow.show() },
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
        setTodayWindow: (window) => {
            todayWindow = window;
        },
    };
};

module.exports = { createTrayMenu };
