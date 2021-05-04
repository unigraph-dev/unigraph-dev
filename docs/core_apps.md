# Core apps

Unigraph has a number of core apps and packages that provides common abstractions and utility functions for users and developers.

## List of core apps (in load order)

This list may be outdated. For the current list in use, check out `/packages/unigraph-dev-backend/src/templates/defaultDb.ts`.

- Semantic: provides basic semantic interfaces (tag, textual, and semantic_properties) and corresponding functions out of the box.
- Core: provides core abstractions - list (array with optional semantic properties) - and corresponding functions.
- Coreuser: provides common user-space features (notification).

## Calling core apps functions

Currently, we code the functions directly into the Unigraph backend - however, we are planning to inject them dynamically on a registry in a future release, so that users can edit core apps functions or choose their alternatives freely.

To call functions for core apps now, refer to the unigraph API in the common package.