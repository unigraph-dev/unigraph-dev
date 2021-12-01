import { Card, Typography } from "@material-ui/core";
import React from "react";
import { getRandomInt, UnigraphObject } from "unigraph-dev-common/lib/api/unigraph";
import { AutoDynamicViewDetailed } from "../components/ObjectView/AutoDynamicViewDetailed";
import { TabContext } from "../utils";

type HomeSection = {
  header: string,
  content: React.ReactElement<any>,
  condition: () => Promise<boolean>,
}

export const HomeSection = ({data}: any) => {
  const [shouldDisplay, setShouldDisplay] = React.useState(false);
  const [flushCondition, setFlushCondition] = React.useState(true);
  const tabContext = React.useContext(TabContext);

  React.useEffect(() => {
    const shouldRender = () => {
      if (tabContext.isVisible()) {
        window.unigraph.runExecutable(data.get('condition')._value.uid, {}).then((ret: any) => {
          if (ret === true) setShouldDisplay(true);
          else setShouldDisplay(false);
        })
      }
    };
    const int = setInterval(shouldRender, 5000);
    if (flushCondition) {
      shouldRender();
      setFlushCondition(false);
    }

    return function cleanup () { clearInterval(int) }
  }, [flushCondition])

  return shouldDisplay ? <Card style={{padding: "24px", margin: "12px"}} variant="outlined" onClick={() => {
    setTimeout(() => {setFlushCondition(true)}, 500)
  }}>
    <Typography variant={"h5"}>{data.get('view/name').as('primitive')}</Typography>
    <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')['_value'])} />
  </Card> : <React.Fragment/>
}

export default function ExplorerHome({id}: any) {

  const [sections, setSection] = React.useState<Partial<HomeSection>[]>([]);

  React.useEffect(() => {
    const id = getRandomInt();

    window.unigraph.subscribeToType("$/schema/home_section", (its: any[]) => {
      setSection(its);
    }, id)

    return function cleanup () {window.unigraph.unsubscribe(id)}
  }, [])


  return <div>
    {sections.map(el => <HomeSection data={el} />)}
  </div>
}