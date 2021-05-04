# Dynamic View

One interesting feature of Unigraph is the ability to create 'dynamic views' - i.e. data-driven views that will be automatically reasoned and displayed in the frontend.

This is currently very much a work in progress, and please make sure to read the documentation below.

Dynamic views are registered in the global map `window.DynamicViews`. You can check out its details in the Javascript console for more information.

## Current Implementation

You can register a dynamic view for your schema programmatically in explorer: just need to call `registerDynamicViews` in the global Window object and provide a hashmap of schema shorthand names (starting with `$/schema`) to your component of type `DynamicViewRenderer`.

You can also register a dynamic list view with automatic subscription support by using the `withUnigraphSubscription` method.

For more instructions, check out `packages/unigraph-dev-explorer/src/examples`.