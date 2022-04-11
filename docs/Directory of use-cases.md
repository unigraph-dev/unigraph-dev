
  - Summary: To keep track of existing and desired use-cases for UG. From feature requests, to full custom apps.
  - Existing use-cases:
    - Inbox with email, tasks, bookmarks, notes
    - Connecting Google Calendar & Gmail to your notes
    - Search through all your data using a global shortcut key
    - Personal dashboard that combines todo lists, calendar events, and daily notes
  - Desired use-cases (user-developed):
    - Threadhelper-like sidebar for quick search and lookup
    - 2D workspace (Jade)
    - Backing up twitter archive
    - Todoist 2-way sync: combining Todoist features with Unigraph bi-directional links  - [[tqiu8]]
    - Simple todo list app written in Swift, using Unigraph as a backend - [[whyrusleeping]]
    - Browser extension that connects with Unigraph - [[whyrusleeping]]
    - Customize actions when opening an URL - [[warpfork]]
    - Integrations with large language models and vector store - [[George Walker]] - later
    - Tabbed interface for notes instead of bullet point nesting - [[fernando]]
    - ActivityWatch integration? - [[erb]] - later
    - Mindmap/logical hierarchy for todo tasks - [[DavidD]] - later
    - A Python environment to do things like embedding search, etc - [[DavidD]] - later
    - ...
  - Other possible use cases:
    - Feed sync: pull in subscription feeds from Youtube/Tumblr/etc, with content-specific views and backlinks to sources such as Youtube channel/blog/etc
    - Archive twitter DMs/messenger chats into Unigraph, associate them with contacts, and search for conversations across different platforms.
    - Custom renderers for different types of note blocks: e.g. HTML or Latex, instead of markdown
    - Create interactive React components as personal dashboard cards on home page
    - Example ideas
      - Making a view of a specific list
      Making a list view of a type
      Making a list view of a query
      - Passing in custom groupers, filters to dynamicList
      Passing in custom components to dynamicList or ADV
      - Subscribing to query results for something other than a list
      Using common UI Unigraph apis (what's available?)
      Adding a command (palette, shortcut, context) as a global command and as conditioned to a type / view
      Inserting data into the db (after consuming from some API)
      Making a new schema (e.g. a article notes page that has a certain shape e.g. attributes for author, title, etc)
      Making a detailed view for a new schema
      
      - Q: should examples be more concrete like "example todo app", "example obsidian syncing script"?
      
      - Query examples:
      Getting a type
      Getting items that include a certain type
      Getting items by name
      Getting items that include a certain type with a certain attribute value