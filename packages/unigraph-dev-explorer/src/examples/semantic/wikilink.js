import { syntax } from 'micromark-extension-wiki-link';
import { toMarkdown } from 'mdast-util-wiki-link'

let warningIssued

function fromMarkdown (opts = {}) {
    const permalinks = opts.permalinks || []
    const defaultPageResolver = (name) => [name.replace(/ /g, '_').toLowerCase()]
    const pageResolver = opts.pageResolver || defaultPageResolver
    const newClassName = opts.newClassName || 'new'
    const wikiLinkClassName = opts.wikiLinkClassName || 'internal'
    // eslint-disable-next-line no-script-url
    const defaultHrefTemplate = (permalink) => `https://google.com`
    const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate
  
    function enterWikiLink (token) {
      this.enter(
        {
          type: 'wikiLink',
          value: null,
          data: {
            alias: null,
            permalink: null,
            exists: null
          }
        },
        token
      )
    }
  
    function top (stack) {
      return stack[stack.length - 1]
    }
  
    function exitWikiLinkAlias (token) {
      const alias = this.sliceSerialize(token)
      const current = top(this.stack)
      current.data.alias = alias
    }
  
    function exitWikiLinkTarget (token) {
      const target = this.sliceSerialize(token)
      const current = top(this.stack)
      current.value = target
    }
  
    function exitWikiLink (token) {
      const wikiLink = this.exit(token)
      let displayName = wikiLink.value
      if (wikiLink.data.alias) {
        displayName = wikiLink.data.alias
      }
    
      wikiLink.data.alias = displayName

      wikiLink.data.hName = 'span'
      wikiLink.data.hProperties = {
        className: "wikilink"
      }
      wikiLink.data.hChildren = [{
        type: 'text',
        value: displayName
      }]
    }
  
    return {
      enter: {
        wikiLink: enterWikiLink
      },
      exit: {
        wikiLinkTarget: exitWikiLinkTarget,
        wikiLinkAlias: exitWikiLinkAlias,
        wikiLink: exitWikiLink
      }
    }
}

function wikiLinkPlugin (opts = {}) {
  const data = this.data()

  function add (field, value) {
    if (data[field]) data[field].push(value)
    else data[field] = [value]
  }

  if (!warningIssued &&
      ((this.Parser &&
        this.Parser.prototype &&
        this.Parser.prototype.blockTokenizers) ||
       (this.Compiler &&
        this.Compiler.prototype &&
        this.Compiler.prototype.visitors))) {
    warningIssued = true
    console.warn(
      '[remark-wiki-link] Warning: please upgrade to remark 13 to use this plugin'
    )
  }

  add('micromarkExtensions', syntax(opts))
  add('fromMarkdownExtensions', fromMarkdown(opts))
  add('toMarkdownExtensions', toMarkdown(opts))
}

wikiLinkPlugin.wikiLinkPlugin = wikiLinkPlugin
export default wikiLinkPlugin