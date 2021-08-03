#!/bin/bash

mkdir packages/unigraph-dev-common/lib
mkdir packages/unigraph-dev-common/lib/data

for entry in "./packages/default-packages"/*
do
  echo "building $entry" 
  ./scripts/unigraph-packager.js "$entry" -o ./packages/unigraph-dev-common/lib/data
done