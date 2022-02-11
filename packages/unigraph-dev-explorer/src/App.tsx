import { createBrowserHistory } from 'history';
import 'typeface-roboto';
import { ThemeProvider, Theme, StyledEngineProvider, createTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getParameters, isElectron, NavigationContext } from './utils';
import { ContextMenu } from './components/UnigraphCore/ContextMenu';
import { InlineSearch } from './components/UnigraphCore/InlineSearchPopup';
import { SearchOverlayPopover } from './pages/SearchOverlay';
import { MobileBar } from './components/UnigraphCore/MobileBar';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const providedTheme = createTheme();
// TODO: custom theme
const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: '100vh',
    },
    appBar: {
        width: '100vw',
        zIndex: theme.zIndex.drawer + 1,
    },
    // necessary for content to be below app bar
    toolbar: {
        minHeight: '48px !important',
    },
    content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(3),
    },
}));

function AppToWrap() {
    const classes = useStyles();
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
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={providedTheme}>
                <AppToWrap />
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;
