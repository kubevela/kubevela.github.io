---
title:  Context
---

When defining the CUE template of the WorkflowStep Definition,
you can use the `context` to get context data of the application.

Here are the full list of available information within `context`:

|Name|Description|
|---|---|
|name|The name of the Component for current workload|
|namespace|The name of the Application|
|labels["$key"]|The value for the key in the labels of the Application|
|context.creationTimestamp|The timestamp of the creation of the Application|
