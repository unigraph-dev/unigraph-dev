import { Button, ButtonGroup, Divider, IconButton } from "@material-ui/core";
import { FormatLineSpacing, Menu } from "@material-ui/icons";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import _ from "lodash";
import React from "react";
import { getObjectContextMenuQuery, onDynamicContextMenu, onUnigraphContextMenu } from "../../components/ObjectView/DefaultObjectContextMenu";
import { AutoDynamicView } from "../../components/ObjectView/AutoDynamicView"
import { DynamicViewRenderer } from "../../global"

const makeCSS = (style: Style) => {
    return `body {
        line-height: ${style.text.lineHeight};
        font-family: '${style.text.fontFamily}'
    }`
}

export type Style = {
    text: {
        "lineHeight": string,
        "fontFamily": string
    }
}

export const HtmlStyleChooser = ({style, onStyleChange, data, context, callbacks}: any) => {
    const [shortcuts, setShortcuts] = React.useState<any[]>([]);

    React.useEffect(() => {
        window.unigraph.getQueries([getObjectContextMenuQuery(data.type['unigraph.id'], true)]).then((res: any) => {
            const items = res[0];
            console.log(items);
            setShortcuts(items);
        })
    }, [])

    return <React.Fragment>
        {shortcuts.length === 0 ? [] : <ButtonGroup variant="outlined">
            {shortcuts.map(it => <Button variant="outlined" onClick={() => {
                console.log(callbacks)
                onDynamicContextMenu(it, data.uid, data, callbacks, context.uid);
            }}>
                <div style={{width: "24px", height: "24px", backgroundImage: `url("${it?._value?.icon?._value?.['_value.%'] || "about:blank"}")`}} ></div>
            </Button>)}
        </ButtonGroup>}
        <ToggleButtonGroup value={style?.text?.lineHeight} onChange={(ev, newStyle) => {onStyleChange(_.merge({}, style, {text: {lineHeight: newStyle}}))}} exclusive>
            <ToggleButton value="1.2"><FormatLineSpacing style={{transform: "scaleY(0.7)"}}/></ToggleButton>
            <ToggleButton value="1.5"><FormatLineSpacing/></ToggleButton>
            <ToggleButton value="1.8"><FormatLineSpacing style={{transform: "scaleY(1.3)"}}/></ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup value={style?.text?.fontFamily} onChange={(ev, newStyle) => {onStyleChange(_.merge({}, style, {text: {fontFamily: newStyle}}))}} exclusive>
            <ToggleButton value="Georgia"><span style={{fontFamily: "Georgia", textTransform: "none"}}>Georgia</span></ToggleButton>
            <ToggleButton value="Times New Roman"><span style={{fontFamily: "Times New Roman", textTransform: "none"}}>Times NR</span></ToggleButton>
            <ToggleButton value="Consolas"><span style={{fontFamily: "Consolas", textTransform: "none"}}>Consolas</span></ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup>
            <ToggleButton onClick={(event) => onUnigraphContextMenu(event, data, context)}>
                <Menu/>
            </ToggleButton>
        </ToggleButtonGroup>
    </React.Fragment>
}

export const Html: DynamicViewRenderer = ({data, context, callbacks}) => {
    const frm = React.useRef(null);
    const userStyle = React.useRef(null);
    const [style, setStyle] = React.useState<Style>({
        text: {
            lineHeight: "1.5",
            fontFamily: "Georgia"
        }
    })
    React.useEffect(() => {
        //console.log(userStyle.current)
        // @ts-expect-error: already checked for nullity
        if (userStyle.current) (userStyle.current as HTMLElement).innerHTML = makeCSS(style)
    }, [style])

    return <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        {context ? <React.Fragment>
            <AutoDynamicView object={context} />
            <Divider/>
        </React.Fragment> : []}
        <iframe srcDoc={data['_value.%']} style={{flexGrow: 1, width: "100%"}} ref={frm} onLoad={() => {
            (frm.current as any).contentDocument.head.insertAdjacentHTML("beforeend", "<style>img{ max-width: 100%; height: auto } video{ max-width: 100%; height: auto } body{margin-bottom: 64px}</style>");
            userStyle.current = (frm.current as any).contentDocument.head.insertAdjacentElement("beforeend", (frm.current as any).contentDocument.createElement('style'));
            // @ts-expect-error: already checked for nullity
            (userStyle.current as HTMLElement).innerHTML = makeCSS(style);
            if (callbacks?.onLoad) callbacks.onLoad(frm);
        }} title={`object-view-${data.uid}`} frameBorder="0" role="article" aria-describedby={`HTML View for object ${data.uid}`}/>
        <div style={{display: "flex", height: "48px", width: "100%", overflow: "auto"}}>
            <HtmlStyleChooser style={style} onStyleChange={setStyle} data={data} context={context} callbacks={{getDocument: () => frm,
                closeTab: () => {
                    window.closeTab(callbacks.viewId);
                }
            }}/>
        </div>
    </div>
}

