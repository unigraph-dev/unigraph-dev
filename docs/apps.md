# Apps and Registry

Unigraph is data-centric. In particular, we believe that the most important aspect of creating user interfaces and apps is the data model and its interconnectivity. We designed our app and registry system around this concept, and we strongly encourage developers to do so as well.

## Apps in Unigraph

Apps in Unigraph is different than its common meaning, because of the reason mentioned above. Generally, an app can be considered as the following model (although we do offer a great freedom in how to design apps without it):

- Metadata (required): basic information about your app, including relevant links, a package name (for other apps to reference it), and other information that help other apps or the user to reference or manage data.
- Data model (required): describes what the data looks like - this should be an independent part without views or widgets. Things may incldue schemas and custom hook-based logic.
- Views (optional): what the user sees when they interact with your app directly. This is most similar to views in a traditional setting, where the user's attention is on your view and only on your view. This is where you have the most freedom to tailor the experience.
- Widgets (optional): can be thought of "mini views" that are integrated into the general UI. For example, it can be a preview popup of a song, or a daily tasks preview for productivity tools. You can expect this part to be integrated into the general UI and have complex interactions with other widgets, turbo-boosting the user's productivity.

## Implementing an app

Currently the app API is pretty much still WIP, but you can access it via the `window.unigraph.apps` object (if you're using explorer).

TODO: add more documentation as I write the API

### Notes
- We do not canonicalize an UI framework specifically; most of our frontend code is written in React but feel free to implement your app in other web frameworks (if you're using explorer) or native (documentation upcoming)