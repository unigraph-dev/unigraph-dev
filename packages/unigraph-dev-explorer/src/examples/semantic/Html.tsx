import {
    Box,
    Button,
    ButtonGroup,
    Card,
    CssBaseline,
    Divider,
    IconButton,
    Popper,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { FormatLineSpacing, Menu } from '@mui/icons-material';
import _ from 'lodash';
import React from 'react';
import rangy from 'rangy';
import 'rangy/lib/rangy-serializer';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';
import { useResizeDetector } from 'react-resize-detector';
import {
    getObjectContextMenuQuery,
    onDynamicContextMenu,
    onUnigraphContextMenu,
    UnigraphMenuItem,
} from '../../components/ObjectView/DefaultObjectContextMenu';
import { AutoDynamicView } from '../../components/ObjectView/AutoDynamicView';
import { DynamicViewRenderer } from '../../global.d';
import { TabContext } from '../../utils';

const makeCSS = (style: Style) => `body {
        line-height: ${style.text.lineHeight};
        font-family: '${style.text.fontFamily}';
        font-size: ${style.text.fontSize};
    }`;

export type Style = {
    text: {
        lineHeight: string;
        fontFamily: string;
        fontSize: string;
    };
};

export function HtmlStyleChooser({ style, onStyleChange, data, context, callbacks }: any) {
    const [shortcuts, setShortcuts] = React.useState<UnigraphMenuItem[]>([]);

    React.useEffect(() => {
        setShortcuts(
            window.unigraph
                .getState('registry/contextMenu')
                .value['$/schema/html'].filter((el: UnigraphMenuItem) => el.shortcut),
        );
    }, []);

    return (
        <>
            {shortcuts.length === 0 ? (
                []
            ) : (
                <ButtonGroup variant="outlined">
                    {shortcuts.map((it) => (
                        <Button
                            variant="outlined"
                            onClick={() => {
                                it.onClick(data.uid, data, () => false, callbacks, context.uid);
                            }}
                        >
                            {it.icon}
                        </Button>
                    ))}
                </ButtonGroup>
            )}
            <ToggleButtonGroup
                value={style?.text?.lineHeight}
                onChange={(ev, newStyle) => {
                    onStyleChange(_.merge({}, style, { text: { lineHeight: newStyle } }));
                }}
                exclusive
            >
                <ToggleButton value="1.2">
                    <FormatLineSpacing style={{ transform: 'scaleY(0.7)' }} />
                </ToggleButton>
                <ToggleButton value="1.5">
                    <FormatLineSpacing />
                </ToggleButton>
                <ToggleButton value="1.8">
                    <FormatLineSpacing style={{ transform: 'scaleY(1.3)' }} />
                </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
                value={style?.text?.fontSize}
                onChange={(ev, newStyle) => {
                    onStyleChange(_.merge({}, style, { text: { fontSize: newStyle } }));
                }}
                exclusive
            >
                <ToggleButton value="1em">
                    <span style={{ transform: 'scale(0.7)' }}>A</span>
                </ToggleButton>
                <ToggleButton value="1.1em">
                    <span>A</span>
                </ToggleButton>
                <ToggleButton value="1.2em">
                    <span style={{ transform: 'scale(1.3)' }}>A</span>
                </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
                value={style?.text?.fontFamily}
                onChange={(ev, newStyle) => {
                    onStyleChange(_.merge({}, style, { text: { fontFamily: newStyle } }));
                }}
                exclusive
            >
                <ToggleButton value="Georgia">
                    <span style={{ fontFamily: 'Georgia', textTransform: 'none' }}>Georgia</span>
                </ToggleButton>
                <ToggleButton value="Times New Roman">
                    <span
                        style={{
                            fontFamily: 'Times New Roman',
                            textTransform: 'none',
                        }}
                    >
                        Times NR
                    </span>
                </ToggleButton>
                <ToggleButton value="Consolas">
                    <span
                        style={{
                            fontFamily: 'Consolas',
                            textTransform: 'none',
                        }}
                    >
                        Consolas
                    </span>
                </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup>
                <ToggleButton value="Menu" onClick={(event) => onUnigraphContextMenu(event, data, context)}>
                    <Menu />
                </ToggleButton>
            </ToggleButtonGroup>
        </>
    );
}

export const Html: DynamicViewRenderer = ({ data, context, callbacks }) => {
    const tabContext = React.useContext(TabContext);

    const frm = React.useRef(null);
    const userStyle = React.useRef(null);
    const [style, setStyle] = React.useState<Style>({
        text: {
            lineHeight: '1.5',
            fontSize: '1em',
            fontFamily: 'Georgia',
        },
    });
    React.useEffect(() => {
        if (userStyle.current) (userStyle.current as any).innerHTML = makeCSS(style);
    }, [style]);

    const [anchorEl, setAnchorEl] = React.useState<any>(null);
    const [annotation, setAnnotation] = React.useState<any>({});

    const annotations = React.useMemo(() => {
        console.log(context);
        return (context?._value?.children?.['_value['] || [])
            .filter(
                (el: any) =>
                    el?._value?.type?.['unigraph.id'] === '$/schema/subentity' &&
                    el?._value?._value?.type?.['unigraph.id'] === '$/schema/annotation',
            )
            ?.map((el: any) => new UnigraphObject(el?._value?._value))
            ?.filter(Boolean);
    }, [context]);

    const { width, ref } = useResizeDetector();

    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        if (!loaded) return () => undefined;
        const markups: any[] = [];
        const ifrBody = (frm.current as any).contentDocument.body;
        annotations.map((el: any) => {
            const range = (rangy as any).deserializeRange(
                el.get('range').as('primitive'),
                (frm.current as any).contentWindow.document.body,
            );
            const { nativeRange } = range;
            const rects = nativeRange.getClientRects();
            for (let i = 0; i < rects.length; i += 1) {
                const div = (frm.current as any).contentDocument.createElement('div');
                div.style.backgroundColor = el.get('color').as('primitive');
                div.style.left = `${(frm.current as any).contentWindow.scrollX + rects[i].left}px`;
                div.style.top = `${(frm.current as any).contentWindow.scrollY + rects[i].top}px`;
                div.style.width = `${rects[i].width}px`;
                div.style.position = 'absolute';
                div.style.opacity = 0.3;
                div.style.height = `${rects[i].height}px`;
                div.oncontextmenu = (event: any) =>
                    onUnigraphContextMenu(
                        {
                            clientX: event.clientX + ((frm.current as any).getBoundingClientRect()?.left || 0),
                            clientY: event.clientY + ((frm.current as any).getBoundingClientRect()?.top || 0),
                        } as any,
                        el,
                        context,
                        callbacks,
                    );
                div.onclick = (event: any) => {
                    window.unigraph.getState('global/viewPopup').setValue({
                        show: true,
                        anchorPosition: {
                            top: event.clientY + ((frm.current as any).getBoundingClientRect()?.top || 0),
                            left: event.clientX + ((frm.current as any).getBoundingClientRect()?.left || 0),
                        },
                        windowName: event.currentTarget?.ownerDocument?.defaultView?.name,
                        pageName: 'library/object',
                        config: {
                            uid: el._value.notes._value.uid,
                            type: '$/schema/note_block',
                        },
                    });
                };
                (frm.current as any).contentDocument.body.appendChild(div);
                markups.push(div);
            }
        });
        return function cleanup() {
            markups.forEach((el: any) => {
                ifrBody?.removeChild?.(el);
            });
        };
    }, [loaded, style, annotations, width]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
            ref={ref}
        >
            {context ? (
                <>
                    <AutoDynamicView object={context} />
                    <Divider />
                </>
            ) : (
                []
            )}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Popper
                    id="annotation-popper"
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    container={(frm.current as any)?.contentDocument.body}
                >
                    <CssBaseline />
                    <div
                        style={{
                            backgroundColor: 'white',
                            border: '1px gray solid',
                            padding: '3px',
                            borderRadius: '3px',
                        }}
                        onPointerUp={async () => {
                            // console.log(annotation);
                            const [annotationUid] = await window.unigraph.addObject(
                                {
                                    source: { uid: context.uid },
                                    notes: {
                                        text: {
                                            _value: '',
                                            type: { 'unigraph.id': '$/schema/markdown' },
                                        },
                                        $context: {
                                            _hide: true,
                                        },
                                    },
                                    text: annotation.text,
                                    range: annotation.range,
                                    color: 'yellow',
                                },
                                '$/schema/annotation',
                                undefined,
                                [],
                            );
                            window.unigraph.runExecutable('$/executable/add-item-to-list', {
                                where: context.uid,
                                item: annotationUid,
                            });
                        }}
                    >
                        <div
                            style={{
                                height: '24px',
                                width: '24px',
                                transform: 'scale(0.875)',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' style='width:24px;height:24px' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' d='M18.5,1.15C17.97,1.15 17.46,1.34 17.07,1.73L11.26,7.55L16.91,13.2L22.73,7.39C23.5,6.61 23.5,5.35 22.73,4.56L19.89,1.73C19.5,1.34 19,1.15 18.5,1.15M10.3,8.5L4.34,14.46C3.56,15.24 3.56,16.5 4.36,17.31C3.14,18.54 1.9,19.77 0.67,21H6.33L7.19,20.14C7.97,20.9 9.22,20.89 10,20.12L15.95,14.16' /%3E%3C/svg%3E")`,
                            }}
                        />
                    </div>
                </Popper>
                <iframe
                    srcDoc={data['_value.%']}
                    style={{ flexGrow: 1, width: '100%' }}
                    ref={frm}
                    onLoad={() => {
                        (frm.current as any).contentDocument.head.insertAdjacentHTML(
                            'beforeend',
                            '<style>img{ max-width: 100%; height: auto } video{ max-width: 100%; height: auto } body{margin-bottom: 64px}</style>',
                        );
                        (frm.current as any).contentDocument.head.insertAdjacentHTML(
                            'beforeend',
                            '<base target="_parent" />',
                        );
                        userStyle.current = (frm.current as any).contentDocument.head.insertAdjacentElement(
                            'beforeend',
                            (frm.current as any).contentDocument.createElement('style'),
                        );
                        // @ts-expect-error: already checked for nullity
                        (userStyle.current as HTMLElement).innerHTML = makeCSS(style);
                        if (callbacks?.onLoad) callbacks.onLoad(frm);
                        (frm.current as any).contentDocument.addEventListener('pointerup', (event: any) => {
                            const window = (frm.current as any).contentWindow;
                            const range = window.getSelection().getRangeAt(0);
                            if (!range?.collapsed) {
                                // Handle selection event here
                                const getBoundingClientRect = () => range.getBoundingClientRect();
                                setAnchorEl({
                                    getBoundingClientRect,
                                });
                                setAnnotation({
                                    range: (rangy as any).serializeRange(range, true, window.document.body),
                                    text: window.getSelection().toString(),
                                });
                                // setAnchorEl(window.getSelection());
                            } else {
                                setAnchorEl(null);
                            }
                        });
                        setLoaded(true);
                    }}
                    title={`object-view-${data.uid}`}
                    frameBorder="0"
                    role="article"
                    aria-describedby={`HTML View for object ${data.uid}`}
                />
            </div>
            <div
                style={{
                    display: callbacks?.noBar ? 'none' : 'flex',
                    height: '48px',
                    width: '100%',
                    overflow: 'auto',
                }}
            >
                <HtmlStyleChooser
                    style={style}
                    onStyleChange={setStyle}
                    data={data}
                    context={context}
                    callbacks={{
                        getDocument: () => frm,
                        closeTab: () => {
                            window.closeTab(tabContext.viewId);
                        },
                    }}
                />
            </div>
        </div>
    );
};
