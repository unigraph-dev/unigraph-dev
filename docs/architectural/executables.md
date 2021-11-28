---
updated_at: 2021-11-27T15:02:34-05:00
---
# Executables

You can use executable objects to automate any tasks in Unigraph.

## Environments

Environment is of type "environment"/"language", for example `routine/js`.

We will support source code analysis for assigning environments in the future.

List of environments:
- routine: CPU-inexpensive code that are ran on the (backend) main thread, For example, periodically fetching RSS feeds for news.
- worker: CPU-expensive code that would be ran on (backend) worker threads. For example, doing NER with a pre-trained language model.
- component: view components that would be rendered in frontend.
- client: functions that are executed in frontend.
- lambda: small, functional components that are similar to routine and executed in backend.

## Context and APIs

Executable objects can access their contexts and the Unigraph API via global (comparing to executables) objects:

In JS/TS, they are: `context, unigraph`, of type `ExecContext, Unigraph`.

In JS/TS, you can get type annotations and autocomplete by enforcing your function to the `UnigraphExecutable` generic type with type argument being a map of your named arguments. 

Additionally, `context.params` describes all parameters received when invoking the code, and `context.callbacks` (client or frontend only) are all callbacks supplied by the parent component invoking it.