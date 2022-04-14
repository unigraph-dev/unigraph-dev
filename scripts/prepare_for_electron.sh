#!/usr/bin/env bash

rm -rf packages/unigraph-dev-electron/buildweb
rm -rf packages/unigraph-dev-electron/distnode
yarn build-deps

# copy frontend code
yarn workspace unigraph-dev-explorer build
cp -r packages/unigraph-dev-explorer/build packages/unigraph-dev-electron/buildweb

# copy backend code
yarn workspace unigraph-dev-backend build
cp -r packages/unigraph-dev-backend/dist packages/unigraph-dev-electron/distnode
cp ./secrets.env.json packages/unigraph-dev-electron/distnode

# copy dgraph
rm -rf packages/unigraph-dev-electron/dgraph
mkdir packages/unigraph-dev-electron/dgraph
cp /opt/unigraph/dgraph packages/unigraph-dev-electron/dgraph || cp ./dgraph-download/dgraph packages/unigraph-dev-electron/dgraph 
cp /opt/unigraph/dgraph_arm64 packages/unigraph-dev-electron/dgraph || cp ./dgraph-download/dgraph_arm64 packages/unigraph-dev-electron/dgraph || true