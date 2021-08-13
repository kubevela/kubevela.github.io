---
title: 工作流中的上下文(context)
---
用户在定义Workflow Step Definition时可以使用context获取application的元信息,可以获取到的信息如下

|用法|含义|
|---|---|
|context.name|应用部署计划的名称|
|context.namespace|应用部署计划的命名空间|
|context.labels["$key"]|应用部署计划的标签(label)中"$key"对应的值|
|context.creationTimestamp|应用部署计划的创建时间|
