#!/usr/bin/env bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -d \"<data directory>\" -b \"<dgraph binary location>\""
   exit 1 # Exit script after printing help
}

while getopts "d:b:" opt
do
   case "$opt" in
      d ) data="$OPTARG" ;;
      b ) dgraph="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

if [ -z "$data" ]
then
   data="/opt/unigraph"
fi

if [ -z "$dgraph" ]
then
   dgraph="/opt/unigraph/dgraph"
fi

par=$( cd $(dirname $0) ; pwd -P )

eval 'mkdir $data || true'
eval 'cd $data && $dgraph alpha --limit "mutations-nquad=2560000; query-edge=2560000;" &'
eval 'cd $data && $dgraph zero &'
sleep 10
eval 'cd $par && yarn backend-start'