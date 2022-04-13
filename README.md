# Unigraph

A local-first and universal knowledge graph, personal search engine, and workspace for your life.

Please join the Discord community below to talk about contributing, or open a GitHub issue if you want to help!

[![Discord](https://img.shields.io/discord/835194192044621885.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/vDTkKar5Vz)

## Docs

- [🧭 Docs home: Unigraph Developer Documentation](https://docs.unigraph.dev/)
- [Data model](<./docs/Data model.md>)
- [Glossary](./docs/Glossary.md)

License:
[MIT](https://github.com/unigraph-dev/unigraph-dev/blob/main/LICENSE)

## Getting started

### Running with Docker image

We provide an experimental Dockerfile for easy setup:

- Building Unigraph: `docker build -t unigraph-devserver .` (this should take roughly 10 minutes max),
- Running Unigraph: `docker run -d -p 4002:4002 -v <data directory>:/opt/unigraph -p 4001:4001 -p 3000:3000 -P unigraph-devserver`, 

To update the Docker image, run `docker build` again after `git pull`.

### Building from source

**1)** Build the [`Dgraph`](https://github.com/unigraph-dev/dgraph) backend binary from source [[reference](https://github.com/unigraph-dev/dgraph#install-from-source)]

> requires `gcc`, `make`, `go>=1.13`

```bash
git clone https://github.com/unigraph-dev/dgraph.git
cd ./dgraph
make oss_install  # installs built binary in $GOPATH/bin
```

```bash
# you can view your $GOPATH by running:  go env GOPATH
# and similarly, confirm binary exists:
> ls $(go env GOPATH)/bin | grep dgraph
dgraph
```

**Alternative** for step **1)**: find Unigraph's Dgraph binary for your platform on [GitHub Releases](https://github.com/unigraph-dev/dgraph/releases) and rename it to `dgraph`. On Linux or macOS, you'll need to make it executable: `chmod +x ./Downloads/dgraph`. Then, continue to step **2)**.

**2)** In the `unigraph` project root, fetch and build project dependencies:

> if you have `node.js` versioning issues, consider using [`nvm`](https://github.com/nvm-sh/nvm). Windows users, see the note further down.

```bash
yarn && yarn build-deps
```

**3)** Move the `Dgraph` binary you built in step **1)** to a new `/opt/unigraph` directory. This is a project default, but you can use a path of your choosing (as well as keep a separate data directory & bin path).

> check that your user can read/write to the path(s) — you may need to e.g. `chown -R $(whoami) /opt/unigraph`

**4)** Run the backend and frontend from the `unigraph` project root!

> the `Dgraph` backend currently requires its [default ports](https://dgraph.io/docs/deploy/ports-usage/#default-ports-used-by-different-nodes) to be free, especially `8080`.


```bash
# run backend with default data and bin path:  /opt/unigraph
./scripts/start_server.sh
# or, run backend with custom paths:
./scripts/start_server.sh -d "<data directory>" -b "<dgraph binary location>"
```


```bash
# run frontend application in a browser:
yarn explorer-start
# or, to run as an electron application:
yarn electron-start
```

> **NOTE:** if the backend failed **during server initialization**, you'll need a clean application state before reattempting:
>
>- `killall dgraph` to kill all running `dgraph` processes, then
>- remove `p/`, `w/`, `zw/` in your data directory (by default `/opt/unigraph`)

> Server initialization is successful upon `unigraph> Unigraph server listening on port 4002` and announcing upserts.


**5)** If you want to use third-party API integrations, consult the **"**API Keys**"** section below.

----
**Alternative Setup for Windows Dev/Technically Savvy Users**
> If you have managed to get a Dgraph instance running in WSL or via Docker, but would like to hack on Unigraph under Windows, the following commands can get the frontend and local backend built and connecting to `Dgraph`. These commands depend on PowerShell. Note that Windows comes with an older version of PowerShell, but you should install the most recent version from [here](https://github.com/PowerShell/PowerShell/releases). The binary, `pwsh.exe`, should be on your path after installation. 

In one PowerShell terminal instance execute the following commands:
```
yarn
yarn build-deps
yarn backend-start
```

In another PowerShell terminal instance run this command, when the last command of the previous set has finished upserting to `Dgraph`:
```
yarn explorer-start
```
If you want to change Unigraph's default `Ctrl + e` shortcut for the Omnibar (which in Windows can pop up the browser's search bar), you can do it by editing the following section of `packages\unigraph-dev-explorer\src\pages\SearchOverlay.tsx` (currently hardcoded):

```typescript
document.onkeydown = function(evt) {
    evt = evt || window.event;
    if ((evt.ctrlKey || evt.metaKey) && evt.key === 'e' && !isElectron()) {
        if (open === undefined) setSearchEnabled(!searchEnabled);
    }
    if ((searchEnabled) && evt.key === 'Escape') {
        setSearchEnabled(false);
    }
};
```

## Updating Unigraph

Unigraph is being worked on constantly. If you're interested in getting the latest version, do the following:

- `git pull` to retrieve the latest changes;
- make sure backend and dgraph is not running;
- `yarn build-deps` to re-build common libraries and default packages;
- `./script/start_server.sh` to re-start backend, and update any new packages if available.

----


## Structure

This repository contains all relevant source code for Unigraph:

- packages/
    * unigraph-dev-backend/ : Unigraph local backend in Node.js.
    * unigraph-dev-common/ : shared data and utilities between backend and frontend.
    * unigraph-dev-explorer/ : Unigraph frontend in React.
    * default-packages/ : schema, data and code declarations for packages providing default functionalities. If you are looking to build packages, you can study example projects here.

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

For how to obtain them, see [the docs page](https://docs.unigraph.dev/Unigraph+Developer+Documentation#%F0%9F%A7%AD+Getting+started).
