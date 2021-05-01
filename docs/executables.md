# Executables

You can use executable objects to automate any tasks in Unigraph.

## Environments

Environment is of type "environment"/"language", for example `routine/js`.

We will support source code analysis for assigning environments in the future.

List of environments:
- routine: CPU-inexpensive code that are ran on the (backend) main thread, For example, periodically fetching RSS feeds for news.
- worker: CPU-expensive code that would be ran on (backend) worker threads. For example, doing NER with a pre-trained language model.