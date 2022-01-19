mkdir -Force packages/unigraph-dev-common/lib
mkdir -Force packages/unigraph-dev-common/lib/data

Get-ChildItem -Path ./packages/default-packages/* |

Foreach-Object {
  #Do something with $_.FullName
  Write-Output "building $_" 
  node ./scripts/unigraph-packager.js $_.FullName -o ./packages/unigraph-dev-common/lib/data
}
