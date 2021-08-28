
import './home.css';
import DetailedObjectView from '../components/UserLibrary/UserLibraryObject';
import { pb_init } from '../components/UnigraphCore/Pinboard';
pb_init();

function ExplorerHome({id}: any) {

  return <DetailedObjectView uid={"$/entity/dashboard"} id={id} />

}

export default ExplorerHome
