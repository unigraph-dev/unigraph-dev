#!/bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -d \"<data directorty>\" -b \"<dgraph binary location>\""
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

eval 'cd $data && $dgraph alpha &'
eval 'cd $data && $dgraph zero &'
sleep 10
eval 'cd $par && yarn backend-start'