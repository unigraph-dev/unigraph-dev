import { createBrowserHistory } from "history";
import 'typeface-roboto';
import { makeStyles } from '@material-ui/core/styles';

import { getParameters, isElectron, NavigationContext } from './utils';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ContextMenu } from "./components/UnigraphCore/ContextMenu";
import { InlineSearch } from "./components/UnigraphCore/InlineSearchPopup";
import { SearchOverlayPopover } from "./pages/SearchOverlay";


// TODO: custom theme
const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    height: "100vh"
  },
  appBar: {
    width: '100vw',
    zIndex: theme.zIndex.drawer + 1,
  },
  // necessary for content to be below app bar
  toolbar: {
    minHeight: '48px !important'
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
}));

function App() {
  const classes = useStyles();
  const history = createBrowserHistory();
  const componentPathName = (new URLSearchParams(window.location.search)).get('pageName');
  const config = getParameters(window.location.search.replace('?', ''));
  //console.log(componentPathName)
  document.body.style.backgroundColor = "unset"

  return (
    <NavigationContext.Provider value={(location: string) => {history.push(location)}}>
      <div className={classes.root}>
        <DndProvider backend={HTML5Backend}>
          <div id="global-elements">
            <SearchOverlayPopover />
            <ContextMenu />
            <InlineSearch />
          </div>
          {componentPathName ? window.unigraph.getState('registry/pages').value[componentPathName].constructor(config) : []}
        </DndProvider>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
