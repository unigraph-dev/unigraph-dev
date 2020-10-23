# unigraph-dev

A local-first and universal graph database, knowledge engine, and workspace for your life.

## Getting started

* Recommend using [nvm](https://github.com/nvm-sh/nvm) for managing Node.js versions.
  * On MacOS, can do `brew install nvm`, though maintainers [recommend against this](https://github.com/nvm-sh/nvm#installing-and-updating), favoring bash install
  * Not required, but makes Node upgrades easier

* Using [Yarn](https://github.com/yarnpkg/yarn) for package management
  * `brew install yarn` or see [Yarn installation docs](https://classic.yarnpkg.com/en/docs/install)

* Install dependencies:
  ```
  yarn
  ```

* Run the project
  ```
  yarn start
  # or, for a simple example script (create + read)
  yarn example
  ```
  
## Architecture

We use a local-first architecture for unigraph-dev. This repository contains the "backend" part of the project, 
packaged with a graph database. For more detailed documentations on architecture, check out `docs/architecture.md` (work in progress).