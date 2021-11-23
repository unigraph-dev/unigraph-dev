const readLaterUid = unigraph.getNamespaceMapUid('$/entity/read_later');
const feedItems = await unigraph.getQueries([`(func: uid(${readLaterUid})) @normalize @cascade { _value { 
    children { <_value[> {
      _value {
              _value {
          items: count(uid)
          type @filter(eq(<unigraph.id>, "$/schema/incremental_reader_item"))
        }
      }
    } } } }`]);
const finalItems = (feedItems[0]?.[0]?.items || 0);
return finalItems > 0;