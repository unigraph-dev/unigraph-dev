---
updated_at: 2021-11-27T14:56:29-05:00
---
# Dgraph

Dgraph is our preferred underlying graph database written in Go. This document contains notes about how unigraph works with dgraph and some useful snippets to navigate the database.

We use a custom fork of dgraph which can be founded in the github organization.

## Uncanonical things we're doing on dgraph
- In our fork, we re-added the removed feature of predicate list, mostly for dynamical object support. Most data with defined schema can be accessed without it.

## Snippets

### Query for all objects with unigraph.id

### Create relation
```{
  "set": {
  "uid": "0xa4",
  "_value[": [
  {"_value": {"uid": "0x7a"}}
]
}
}```