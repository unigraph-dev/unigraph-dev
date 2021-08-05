import { createBrowserHistory } from "history";
import 'typeface-roboto';
import { makeStyles } from '@material-ui/core/styles';

import { AppDrawer } from './components';

import { getParameters, NavigationContext } from './utils';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


// TODO: custom theme
const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    height: "90vh"
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



export const components: Record<string, any> = {
  'appdrawer': {
    'constructor': (props: any) => <AppDrawer {...props} />,
  },
}

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
          {componentPathName ? window.unigraph.getState('registry/pages').value[componentPathName].constructor(config) : []}
        </DndProvider>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
