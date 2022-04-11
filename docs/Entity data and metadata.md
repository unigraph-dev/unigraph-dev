
  **Entity data** are data that are defined explicitly in schema, following Unigraph's data model.
  **Metadata** are data that are implicitly defined in schema, usually with the `_` symbol in the beginning.
  Note: this distinction from the usual meaning of metadata - for example, the metadata in other apps includes the senders/recepients and date and time of email, but these are considered entity data in Unigraph.
  ## Should I make it metadata?
  - The rule of thumb is that, if this piece of information provides _syntactic_ information, then it's metadata; and if it provides _semantic_ information, then it's entity data.
  - Any rule of thumb is not perfect - so check out the next section for some examples as well.
  ## Common metadata
  - `_hide`: (boolean) whether this entity should be hidden from general views.
  - `_propertyType`: (enum of "inheritance") what type of special relationship is this entity in relating to another entity as a property.
  - `_index`: (object, `{'_value.%i': integer}`) index of the child item (in `_value` field) in relation to the parent object.
  - `_createdAt`, `_updatedAt` (datetime) when the parent entity is created or updated.
  - `_pos` (string in the form of `x:y:w:h`) used in pinboards, designating the element's position on the board.
  - `_backgroundImage` (string of url) the background image of an entity. **NOTE**: the properties of `color` and `accent_color`  are entity data instead of metadata, since they provide semantic meaning (by distinguishing a type of entity from another)
  - `_key`: (string) used in arrays and maps to specify which child to look up. In `$/composer/Array`, children with duplicate `_key` will overwrite older children.
  - `_externalUrl`: (string) used to specify if an entity has an external location to open.
  ## Notes
  1. The naming convention between metadata and entity