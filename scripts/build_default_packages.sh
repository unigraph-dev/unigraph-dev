#!/bin/bash

mkdir packages/unigraph-dev-common/lib
mkdir packages/unigraph-dev-common/lib/data

for entry in "./packages/default-packages"/*
do
  ./scripts/unigraph-packager.js "$entry" -o ./packages/unigraph-dev-common/lib/data
done