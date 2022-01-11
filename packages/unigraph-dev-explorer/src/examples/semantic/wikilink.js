/* eslint-disable no-plusplus */
import { toMarkdown } from 'mdast-util-wiki-link';

let warningIssued;

const codes = {
    horizontalTab: -2,
    virtualSpace: -1,
    nul: 0,
    eof: null,
    space: 32,
};

function markdownLineEndingOrSpace(code) {
    return code < codes.nul || code === codes.space;
}

function markdownLineEnding(code) {
    return code < codes.horizontalTab;
}

function syntax(opts = {}) {
    const aliasDivider = opts.aliasDivider || ':';

    const aliasMarker = aliasDivider;
    const startMarker = '[[';
    const endMarker = ']]';

    function tokenize(effects, ok, nok) {
        let data;
        let alias;

        let aliasCursor = 0;
        let startMarkerCursor = 0;
        let endMarkerCursor = 0;
        let depth = 0;

        return start;

        function start(code) {
            if (code !== startMarker.charCodeAt(startMarkerCursor)) return nok(code);

            effects.enter('wikiLink');
            effects.enter('wikiLinkMarker');

            return consumeStart(code);
        }

        function consumeStart(code) {
            if (startMarkerCursor === startMarker.length) {
                effects.exit('wikiLinkMarker');
                return consumeData(code);
            }

            if (code !== startMarker.charCodeAt(startMarkerCursor)) {
                return nok(code);
            }

            effects.consume(code);
            startMarkerCursor++;

            return consumeStart;
        }

        function consumeData(code) {
            if (markdownLineEnding(code) || code === codes.eof) {
                return nok(code);
            }

            effects.enter('wikiLinkData');
            effects.enter('wikiLinkTarget');
            return consumeTarget(code);
        }

        function consumeTarget(code) {
            if (code === aliasMarker.charCodeAt(aliasCursor)) {
                if (!data) return nok(code);
                effects.exit('wikiLinkTarget');
                effects.enter('wikiLinkAliasMarker');
                return consumeAliasMarker(code);
            }

            if (code === startMarker.charCodeAt(0)) {
                startMarkerCursor = 0;
                depth += 1;
            }

            if (code === endMarker.charCodeAt(endMarkerCursor) && depth === 0) {
                if (!data) return nok(code);
                effects.exit('wikiLinkTarget');
                effects.exit('wikiLinkData');
                effects.enter('wikiLinkMarker');
                return consumeEnd(code);
            }
            if (code === endMarker.charCodeAt(0)) {
                endMarkerCursor = 0;
                depth -= 1;
            }

            if (markdownLineEnding(code) || code === codes.eof) {
                return nok(code);
            }

            if (!markdownLineEndingOrSpace(code)) {
                data = true;
            }

            effects.consume(code);

            return consumeTarget;
        }

        function consumeAliasMarker(code) {
            if (aliasCursor === aliasMarker.length) {
                effects.exit('wikiLinkAliasMarker');
                effects.enter('wikiLinkAlias');
                return consumeAlias(code);
            }

            if (code !== aliasMarker.charCodeAt(aliasCursor)) {
                return nok(code);
            }

            effects.consume(code);
            aliasCursor++;

            return consumeAliasMarker;
        }

        function consumeAlias(code) {
            if (code === endMarker.charCodeAt(endMarkerCursor)) {
                if (!alias) return nok(code);
                effects.exit('wikiLinkAlias');
                effects.exit('wikiLinkData');
                effects.enter('wikiLinkMarker');
                return consumeEnd(code);
            }

            if (markdownLineEnding(code) || code === codes.eof) {
                return nok(code);
            }

            if (!markdownLineEndingOrSpace(code)) {
                alias = true;
            }

            effects.consume(code);

            return consumeAlias;
        }

        function consumeEnd(code) {
            if (endMarkerCursor === endMarker.length) {
                effects.exit('wikiLinkMarker');
                effects.exit('wikiLink');
                return ok(code);
            }

            if (code !== endMarker.charCodeAt(endMarkerCursor)) {
                return nok(code);
            }

            effects.consume(code);
            endMarkerCursor++;

            return consumeEnd;
        }
    }

    const call = { tokenize };

    return {
        text: { 91: call }, // left square bracket
    };
}

function fromMarkdown(opts = {}) {
    // const permalinks = opts.permalinks || []
    // const defaultPageResolver = (name) => [name.replace(/ /g, '_').toLowerCase()]
    // const pageResolver = opts.pageResolver || defaultPageResolver
    // const newClassName = opts.newClassName || 'new'
    // const wikiLinkClassName = opts.wikiLinkClassName || 'internal'
    // eslint-disable-next-line no-script-url
    // const defaultHrefTemplate = (permalink) => `https://google.com`
    // const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate

    function enterWikiLink(token) {
        this.enter(
            {
                type: 'wikiLink',
                value: null,
                data: {
                    alias: null,
                    permalink: null,
                    exists: null,
                },
            },
            token,
        );
    }

    function top(stack) {
        return stack[stack.length - 1];
    }

    function exitWikiLinkAlias(token) {
        const alias = this.sliceSerialize(token);
        const current = top(this.stack);
        current.data.alias = alias;
    }

    function exitWikiLinkTarget(token) {
        const target = this.sliceSerialize(token);
        const current = top(this.stack);
        current.value = target;
    }

    function exitWikiLink(token) {
        const wikiLink = this.exit(token);
        let displayName = wikiLink.value;
        if (wikiLink.data.alias) {
            displayName = wikiLink.data.alias;
        }

        wikiLink.data.alias = displayName;

        wikiLink.data.hName = 'span';
        wikiLink.data.hProperties = {
            className: 'wikilink',
        };
        wikiLink.data.hChildren = [
            {
                type: 'text',
                value: displayName,
            },
        ];
    }

    return {
        enter: {
            wikiLink: enterWikiLink,
        },
        exit: {
            wikiLinkTarget: exitWikiLinkTarget,
            wikiLinkAlias: exitWikiLinkAlias,
            wikiLink: exitWikiLink,
        },
    };
}

function wikiLinkPlugin(opts = {}) {
    const data = this.data();

    function add(field, value) {
        if (data[field]) data[field].push(value);
        else data[field] = [value];
    }

    if (
        !warningIssued &&
        ((this.Parser && this.Parser.prototype && this.Parser.prototype.blockTokenizers) ||
            (this.Compiler && this.Compiler.prototype && this.Compiler.prototype.visitors))
    ) {
        warningIssued = true;
        console.warn('[remark-wiki-link] Warning: please upgrade to remark 13 to use this plugin');
    }

    add('micromarkExtensions', syntax({ aliasDivider: '±', ...opts }));
    add('fromMarkdownExtensions', fromMarkdown(opts));
    add('toMarkdownExtensions', toMarkdown(opts));
}

wikiLinkPlugin.wikiLinkPlugin = wikiLinkPlugin;
export default wikiLinkPlugin;
