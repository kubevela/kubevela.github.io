---
title: Performance Fine-tuning
---

### Recommended Configurations

When cluster scale becomes large and more applications are needed for managing, KubeVela controller performance might have bottleneck problems due to inappropriate parameters.

According to the KubeVela performance test, three sets of parameters are recommended in clusters with different scales as below.

| Scale  |  #Nodes |    #Apps |    #Pods | concurrent-reconciles | kube-api-qps | kube-api-burst |  CPU | Memory |
| :----: | ------: | -------: | -------: | --------------------: | :----------: | -------------: | ---: | -----: |
| Small  |   < 200 |  < 3,000 | < 18,000 |                     2 |     300      |            500 |  0.5 |    1Gi |
| Medium |   < 500 |  < 5,000 | < 30,000 |                     4 |     500      |            800 |    1 |    2Gi |
| Large  | < 1,000 | < 12,000 | < 72,000 |                     4 |     800      |          1,000 |    2 |    4Gi |

> The above configurations are based on medium size applications (each application contains 2~3 components and 5~6 resources). If the applications in your scenario are generally larger, e.g., containing 20 resources, then you could increase the application number accordingly to find the appropriate configuration and parameters.

### Fine-tuning Methods

You might encounter various performance bottlenecks. Read the following examples and try to find the proper solution for your problem.

1. Applications could be created. Its managed resources are available but indirect resources are not. For example, Deployments in webservice are successfully created but Pods are not. You could check kube-controller-manager and see if there is performance bottleneck problems with it.
2. Applications could be created. Its managed resources are not available and there is no rendering problem with the application. Check if apiserver has lots of requests waiting in queue. The mutating requests for managed resources might be blocked at apiserver.
3. Applications could be found in cluster but no status information could be displayed. If there is no problem with the application content, it might be caused by the KubeVela controller bottleneck, such as limiting requests to apiserver. Increase **kube-api-qps / kube-api-burst** and check if CPU is overloaded. If CPU is not overloaded, check if the thread number is below the number of CPU cores.
4. KubeVela Controller itself could crash frequently due to Out-Of-Memory. Increase the memory to solve it.

> Read more details in [KubeVela Performance Test Report](/blog/2021/08/30/kubevela-performance-test)