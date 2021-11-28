---
updated_at: 2021-11-27T14:56:29-05:00
---
# Optimization

This is a list of optimization tips for Unigraph.

### Avoid querying the whole graph
When possible, use:

- graph relations (including reverse queries)
- sorting, limits, and pagination
- schema-specific queries instead of `expand(_userpredicate_)`

instead of querying the whole graph.

### Add specific subscription IDs and UIDs when updating a query
You can save your subscription IDs or just use UIDs of affected objects to speed up the query process (otherwise every subscription would be updated, which can be slow)