# Apps and Registry

NOTE: This is a high level documentation describing how apps work with the Unigraph ecosystem. For a lower-level summary of how app packages are handled, see [packages](./packages.md).

Unigraph is data-centric. In particular, we believe that the most important aspect of creating user interfaces and apps is the data model and its interconnectivity. We designed our app and registry system around this concept, and we strongly encourage developers to do so as well.

## Apps in Unigraph

Apps in Unigraph is different than its common meaning, because of the reason mentioned above. Generally, an app can be considered as the following model (although we do offer a great freedom in how to design apps without it):

- Metadata (required): basic information about your app, including relevant links, a package name (for other apps to reference it), and other information that help other apps or the user to reference or manage data.
- Data model (required): describes what the data looks like - this should be an independent part without views or widgets. Things may incldue schemas and custom hook-based logic.
- Views (optional): what the user sees when they interact with your app directly. This is most similar to views in a traditional setting, where the user's attention is on your view and only on your view. This is where you have the most freedom to tailor the experience.
- Widgets (optional): can be thought of "mini views" that are integrated into the general UI. For example, it can be a preview popup of a song, or a daily tasks preview for productivity tools. You can expect this part to be integrated into the general UI and have complex interactions with other widgets, turbo-boosting the user's productivity.

## Namespace
An app (or package, if there isn't a user-facing UI) can have the following sub-namespace:
- `$/package/app_name/app_version/schema/`: A map for all schemas in a package.
- `$/package/app_name/app_version/executable/`: A map for all executables in a package.
- `$/package/app_name/app_version/entity/`: A map for all named entities in a package.

## Implementing an app

May 4, 2021: details about the app creation process is still being considered and subject to change. Some examples of apps are in `packages/unigraph-dev-common/src/data/` ending with `.pkg.ts`. 

We don't have a dynamic transpiling pipeline in userspace yet, so the packages are currently statically loaded during compile time. We'll plan to make it better in the future.

### Notes
- We do not canonicalize an UI framework specifically; most of our frontend code is written in React but feel free to implement your app in other web frameworks (if you're using explorer) or native (documentation upcoming)