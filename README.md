# Unigraph

A local-first and universal knowledge graph, personal search engine, and workspace for your life.

[![Discord](https://img.shields.io/discord/835194192044621885.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/vDTkKar5Vz)

## Docs

[TO BE UPDATED]

Quick links:

- [Schemas and Objects (overview)](./docs/architectural/schemas_and_objects.md)
- [Data model](./docs/architectural/data_model.md)
- [Glossary](./docs/glossary.md)

## Getting started

1. You'll need the custom dgraph binary from <https://github.com/unigraph-dev/dgraph>. Follow the **Build from Source section** instructions carefully, but the build process would just take a couple of minutes.
2. At the project root run `yarn` and then `yarn build-deps` to fetch dependencies and build common files needed to build backend and frontend.
3. Put your dgraph binary in a folder at `/opt/unigraph`, then run `./scripts/start_server.sh` (alternatively you can use `./scripts/start_server.sh -d "<data directorty>" -b "<dgraph binary location>"`).
4. Run `yarn explorer-start` to start the web frontend. If you want to use electron instead, run `yarn electron-start` after.

Note: If you want to use third-party API integrations, follow the steps below to put your API keys.

Note: If the initial server setup failed, you'll need to kill all Dgraph processes (`killall dgraph`), then manually remove `p/, w/, zw/` (dgraph data) from the data directory (normally `/opt/unigraph`)

## Structure

This repository contains all relevant source code for Unigraph:

- packages/
    * unigraph-dev-backend/ : Unigraph local backend in Node.js.
    * unigraph-dev-common/ : shared data and utilities between backend and frontend.
    * unigraph-dev-explorer/ : Unigraph frontend in React.
    * default-packages/ : schema, data and code declarations for packages providing default functionalities. If you are looking to build packages, you can study example projects here.

## License

MIT License.

## Contributing

This page will be updated in a few days, but please join the Discord community in the mean time to talk about contributing, or open a GitHub issue if you want to help!

## API Keys

To use third-party API integrations, obtain desired API keys and put them in this format in a file named `secrets.env.json` before starting the server:

```
{
    "twitter": {
        "api_key": "abc",
        "api_secret_key": "abc",
        "bearer_token": "abc"
    },
    "reddit": {
        "client_id": "abc"
    },
    "openai": {
        "api_key": "abc"
    },
    "google": {
        "client_id": "abc",
        "client_secret": "abc"
    }
}
```
