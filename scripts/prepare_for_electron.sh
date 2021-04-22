#!/bin/bash

rm -rf packages/unigraph-dev-electron/build
rm -rf packages/unigraph-dev-electron/dist
yarn build-common

# copy frontend code
yarn workspace unigraph-dev-explorer build
cp -r packages/unigraph-dev-explorer/build packages/unigraph-dev-electron/build

# copy backend code
yarn workspace unigraph-dev-backend build
cp -r packages/unigraph-dev-backend/dist packages/unigraph-dev-electron/dist

# copy dgraph
rm -rf packages/unigraph-dev-electron/dgraph
mkdir packages/unigraph-dev-electron/dgraph
cp /opt/unigraph/dgraph packages/unigraph-dev-electron/dgraph