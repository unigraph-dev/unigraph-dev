import _ from 'lodash';
import * as React from 'react';

const layoutClassName = 'react-grid-layout';

/*
 * A simple HOC that provides facility for listening to container resizes.
 *
 * The Flow type is pretty janky here. I can't just spread `WPProps` into this returned object - I wish I could - but it triggers
 * a flow bug of some sort that causes it to stop typechecking.
 */
export default function WidthProvideRGL(ComposedComponent: any) {
    return class WidthProvider extends React.Component {
        // eslint-disable-next-line react/static-property-placement
        static defaultProps = {
            measureBeforeMount: false,
        };

        // eslint-disable-next-line react/state-in-constructor
        state = {
            width: 0,
        };

        elementRef = React.createRef<HTMLDivElement>();

        mounted = false;

        timeout: any;

        componentDidMount() {
            this.mounted = true;
            this.elementRef.current?.ownerDocument.defaultView?.addEventListener('resize', this.onWindowResize);
            // Call to properly set the breakpoint and resize the elements.
            // Note that if you're doing a full-width element, this can get a little wonky if a scrollbar
            // appears because of the grid. In that case, fire your own resize event, or set `overflow: scroll` on your body.
            this.onWindowResize();
        }

        componentWillUnmount() {
            this.mounted = false;
            this.elementRef.current?.ownerDocument.defaultView?.removeEventListener('resize', this.onWindowResize);
        }

        onWindowResize = _.throttle(() => {
            console.log('yooo');
            if (!this.mounted) return;
            const node = this.elementRef.current; // Flow casts this to Text | Element
            // fix: grid position error when node or parentNode display is none by window resize
            // #924 #1084
            if (node instanceof HTMLElement && node.offsetWidth) {
                this.setState({ width: node.offsetWidth });
            }
            // if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                console.log('hi', this.elementRef.current?.offsetWidth);
                if (this.elementRef.current) this.setState({ width: this.elementRef.current.offsetWidth });
            }, 300);
        }, 100);

        render() {
            const { measureBeforeMount, ...rest } = this.props as any;
            if (measureBeforeMount && !this.mounted) {
                return (
                    <div
                        className={`${(this.props as any).className} ${layoutClassName}`}
                        style={(this.props as any).style}
                        // $FlowIgnore ref types
                        ref={this.elementRef}
                    />
                );
            }

            return <ComposedComponent innerRef={this.elementRef} {...rest} {...this.state} />;
        }
    };
}
