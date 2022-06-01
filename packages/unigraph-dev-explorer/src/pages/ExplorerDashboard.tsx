import './home.css';
import DetailedObjectView from '../components/UserLibrary/UserLibraryObject';

function ExplorerDashboard({ id }: any) {
    return <DetailedObjectView uid="$/entity/dashboard" type="$/schema/pinboard" id={id} />;
}

export default ExplorerDashboard;
