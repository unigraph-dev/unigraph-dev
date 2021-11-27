# Optimization

This documentation outlines some of the best practices in developing on or with Unigraph. Feel free to contribute your thoughts via pull requests or issues!
## 1. Explicit request = best
If you know the structure of your data, best to use explicit request to save a ton of time. For example:
```
{
  q(func: uid(par)) {
    uid
    _value {
      name {
        <_value.%>
      }
      done {
        <_value.!>
      }
    	users {
        <_value[> {
          <_value> {
        name {
          <_value.%>
        }
      }
        }
      }
    }
  }
  par as var(func: has(type)) @cascade {
    type @filter(eq(<unigraph.id>, "$/schema/todo"))
  }
}
```