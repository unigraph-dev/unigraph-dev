# unigraph-dev monorepo

A local-first and universal graph database, knowledge engine, and workspace for your life.

[Live demo](http://workspace.jingyixu.me:3000)

[![Discord](https://img.shields.io/discord/591914197219016707.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/2x5DxcPnWf)

## Projects

This repository contains all relevant source code for unigraph-dev:

- packages/
    * backend/ : unigraph-dev local backend.

## Docs

Quick links:

- [Schemas and Objects (overview)](./docs/schemas_and_objects.md)
- [Data model](./docs/data_model.md)
- [Glossary](./docs/glossary.md)

## Getting started

1. You'll need the custom dgraph binary from <https://github.com/haojixu/dgraph>.
2. Use the script `scripts/start_server.sh -d "<data directorty>" -b "<dgraph binary location>"` to start the dgraph and unigraph servers.
3. Use `yarn explorer-start` to start the frontend.

## Self-hosted vs Local server

Unigraph-dev provides two ways to manage your graph: either via a self-hosted server or via a local service. Here are a couple of reasons to choose different versions:

Reasons to choose self-hosted:
- If you have existing self-hosted infrastructures (search, wiki, file host, calendar, feed, etc) and want good interop among them;
- If you have multiple devices that can't connect to a LAN all the time (for example, if you have a mobile phone and want to use Unigraph with it);

Reasons to choose local service:
- If you use Unigraph on one device or multiple devices with LAN connectivity;
- If you don't have a VPS or cloud service provider that's geographically near you;
- If you work with a lot of data or blobs.

## Demos
![Demo1](./docs/demo1.png)
