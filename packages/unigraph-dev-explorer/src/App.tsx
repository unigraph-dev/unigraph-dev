import { createBrowserHistory } from 'history';
import { ThemeProvider, Theme, StyledEngineProvider, createTheme } from '@mui/material/styles';
import 'typeface-roboto';
import { styled } from '@mui/styles';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getParameters, globalTheme, isElectron, NavigationContext } from './utils';
import { ContextMenu } from './components/UnigraphCore/ContextMenu';
import { InlineSearch } from './components/UnigraphCore/InlineSearchPopup';
import { SearchOverlayPopover } from './pages/SearchOverlay';
import { MobileBar } from './components/UnigraphCore/MobileBar';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const PREFIX = 'App';

const classes = {
    root: `${PREFIX}-root`,
    appBar: `${PREFIX}-appBar`,
    toolbar: `${PREFIX}-toolbar`,
    content: `${PREFIX}-content`,
};

const StyledStyledEngineProvider = styled(StyledEngineProvider)(({ theme }) => ({
    [`& .${classes.root}`]: {
        display: 'flex',
        height: '100vh',
    },

    [`& .${classes.appBar}`]: {
        width: '100vw',
        zIndex: (theme.zIndex?.drawer || 0) + 1,
    },

    // necessary for content to be below app bar
    [`& .${classes.toolbar}`]: {
        minHeight: '48px !important',
    },

    [`& .${classes.content}`]: {
        flexGrow: 1,
        backgroundColor: theme.palette?.background?.default || '',
        padding: theme.spacing?.(3),
    },
}));

const providedTheme = createTheme(globalTheme);

function AppToWrap() {
    const history = createBrowserHistory();
    const componentPathName = new URLSearchParams(window.location.search).get('pageName');
    const config = getParameters(window.location.search.replace('?', ''));
    // console.log(componentPathName)
    document.body.style.backgroundColor = 'unset';

    return (
        <div className={classes.root}>
            <DndProvider backend={HTML5Backend}>
                <div id="global-elements">
                    <ContextMenu />
                    <InlineSearch />
                    <MobileBar />
                </div>
                {componentPathName
                    ? window.unigraph.getState('registry/pages').value[componentPathName].constructor(config)
                    : []}
            </DndProvider>
        </div>
    );
}

function App() {
    return (
        <StyledStyledEngineProvider injectFirst>
            <ThemeProvider theme={providedTheme}>
                <AppToWrap />
            </ThemeProvider>
        </StyledStyledEngineProvider>
    );
}

export default App;
