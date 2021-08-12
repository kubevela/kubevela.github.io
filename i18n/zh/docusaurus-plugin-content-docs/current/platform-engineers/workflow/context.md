---
title: 工作流中的context
---
用户在定义workflow step definition时可以使用context获取application的元信息,可以获取到的信息如下

|用法|含义|
|---|---|
|context.name|application的名称|
|context.namespace|application的namespace|
|context.labels["$key"]|application的标签(label)中"$key"对应的值|
|context.creationTimestamp|application的创建时间|
