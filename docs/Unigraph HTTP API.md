
  - The Unigraph HTTP API provides a straightforward way to interact with the Unigraph server without using the JavaScript API.
  - For a complete list of events and what they do, see [/packages/unigraph-dev-backend/src/custom.d.ts](https://github.com/unigraph-dev/unigraph-dev/tree/main/packages/unigraph-dev-backend/src/custom.d.ts).
  - Note that all subscription events or sync events (which requires an open messaging channel) will not work.
  - You can use the API via GET requests with `application/json` content type, for example in cURL:
  - ```
  curl --silent --location --request GET 'http://localhost:4001/get_object' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "uidOrName": "$/entity/read_later","noExpand": true
  }'
  ```
  - The `id`, `type`, and `event` fields, per the list of events are optional.