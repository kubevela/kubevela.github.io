---
title: "LFX Mentorship: Building Memory-Bounded LRU Cache for KubeVela's Native Helm Provider"
author: Kavish Parikh
author_title: KubeVela Contributor
author_url: https://github.com/kash2104
author_image_url: https://github.com/kash2104.png
tags: [KubeVela, LFX, Mentorship, CNCF, Helm, LRU, Cache]
description: "A look back at my LFX Mentorship journey and my contributions to the KubeVela community."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Hello, I'm Kavish Parikh (GitHub: [kash2104](https://github.com/kash2104)). In this blog, I want to share my experience participating as an LFX Mentee under the KubeVela project.

My mentorship project, **LRU Cache Eviction for the Native Helm Provider**, focused on improving how KubeVela caches Helm charts during application reconciliation. Over the course of the mentorship, I worked on designing a memory-bounded LRU cache, integrating it into KubeVela, and making the cache reusable across different components of the project.

<!-- truncate -->

## What is LFX Mentorship?

[LFX Mentorship](https://lfx.linuxfoundation.org/) is a mentorship program by the Linux Foundation that provides contributors with an opportunity to work with open-source communities and experienced maintainers.

I was selected as an LFX Mentee for the **2026 Term 2** program under the KubeVela project, where I worked on improving the caching mechanism of its native Helm provider.

## What is KubeVela?

[KubeVela](https://kubevela.io/) is an application delivery and management platform built on top of Kubernetes. It provides higher-level abstractions for defining, deploying, and operating applications without requiring users to manage every underlying Kubernetes resource individually.

One of the core concepts in KubeVela is the **Component**. A component represents a workload or capability that forms part of an application.

KubeVela supports different types of components, including a native **Helm Component**, which allows users to deploy applications packaged as Helm charts.

## Project Details

[Helm](https://helm.sh/) is widely used in the Kubernetes ecosystem to package and distribute applications. A Helm chart contains the Kubernetes resources and configuration required to deploy an application.

KubeVela's **helm chart component** allows a Helm chart to be used as a component of a KubeVela Application.

```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-2
  namespace: lru-test
spec:
  components:
    - name: web
      type: helmchart
      properties:
        chart:
          source: oci://registry-1.docker.io/bitnamicharts/prometheus
          version: 2.1.21
        release:
          name: prom-2
          namespace: lru-test
        values:
          replicaCount: 1
          service:
            type: ClusterIP

```

During reconciliation, the _*helm chart component*_ fetches the chart from sources such as a Helm repository, URL, or OCI registry, processes it, and renders the resulting Kubernetes resources.

KubeVela continuously reconciles applications, so without caching, the Helm component could repeatedly download the same chart during each reconciliation, resulting in unnecessary requests and processing.

To avoid this, the Helm provider maintains a cache of fetched charts.

The existing cache used a `sync.Map` with TTL-based expiration. Immutable chart versions had a longer TTL, while mutable versions such as `latest` or `dev` had shorter expiration periods.

However, TTL alone did not provide a hard limit on memory usage.

A cached chart could remain in memory even after the corresponding Helm component was updated or deleted, until its TTL expired. As more applications used different charts, the cache could continue growing and potentially consume a significant amount of controller memory.

This created a risk of the controller eventually running out of memory.

The goal of the project was therefore to introduce an **LRU cache with a configurable byte limit**, allowing frequently used charts to remain cached while reclaiming memory when the cache reaches its configured capacity.

**Project Link** : https://mentorship.lfx.linuxfoundation.org/project/e103d436-d906-413c-ae93-8aa4bffff377

**Project Mentors** : [Ayush Kumar](https://github.com/roguepikachu), [Vishal Kumar](https://github.com/vishal210893)

**Tracking Issue** : https://github.com/kubevela/kubevela/issues/7106

## Application and Development

The first step was understanding how caching was already being used across KubeVela.

Different parts of the project had their own cache implementations based on `sync.Map`. Since the main goal was to introduce a reusable LRU cache, it made sense to first establish a common cache abstraction that could be shared by different KubeVela components.

Generic cache package was introduced in the central `pkg` repository. This provided a common interface for cache consumers while keeping the underlying implementation separate from the components using it.

With this foundation in place, the existing workflow cache could be migrated to use the shared abstraction, along with its consumers in the main KubeVela repository.

The next phase focused on the LRU implementation.

A traditional LRU cache usually limits the number of entries. For Helm charts, however, the number of entries is not a good representation of memory usage because different charts can have significantly different sizes.

Instead, the new cache uses **byte-based capacity**.

For example, rather than limiting the cache to a fixed number of charts, it can be configured with a maximum memory budget such as 256 MB. Each cached value contributes to this budget, and when adding a new value would exceed the limit, the least recently used entries are evicted.

The cache combines three mechanisms for managing entries:

- **Byte-pressure eviction** removes the least recently used entries when the configured byte limit is reached.
- **TTL expiration** allows individual entries to expire after their configured lifetime.
- **Background sweeping** periodically removes expired entries that are no longer accessed.

The cache is implemented generically on top of [HashiCorp's `golang-lru/v2`](https://github.com/hashicorp/golang-lru) and is not coupled to Helm-specific data structures.

Another important part of the implementation was making cache usage observable. Prometheus metrics were added in Eviction callbacks to track cache hits, misses, and current cache memory.

The new cache was then integrated into KubeVela's Helm provider while keeping Helm-specific operations outside the generic cache. This allows the cache to remain reusable while the Helm provider continues to handle chart-specific processing.

## Project Outcomes

The project resulted in a reusable, memory-bounded cache implementation for KubeVela.

The main capabilities include:

#### 1. Generic LRU caching with configurable byte limits.

```
type LRUStore[K comparable, V any] struct {
	store *hashicorp.Cache[K, *lruCache[V]]
	// maximumMemory Maximum Memory byte size of the cache
	maximumMemory int64 // 0 = unlimited bytes
	// sizeOf computes memory usage for each key/value entry.
	sizeOf func(key K, value V) int64
	// sweepInterval controls how often expired entries are removed.
	sweepInterval time.Duration
	// onEvict callback when an entry is evicted.
	OnEvict func(key K, value V, reason EvictionReason)
	// currentMemory Memory used by the cache
	currentMemory int64
	// mu mutex for synchronizing access to the cache
	mu sync.Mutex
	// pendingEvicts holds the list of eviction events to be processed after releasing the lock
	pendingEvicts []evictionEvent[K, V]
}
```

#### 2. Per-entry TTL support.

```
type lruCache[V any] struct {
	data           V
	cacheDuration  time.Duration
	startTime      time.Time
	memorySize     int64
	evictionReason EvictionReason
}
```

#### 3. Byte-pressure eviction based on the configured memory budget.

#### 4. Lazy expiration of expired entries.

#### 5. Periodic background cleanup.

```
func (l *LRUStore[K, V]) run(ctx context.Context) {
	ticker := time.NewTicker(l.sweepInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			l.mu.Lock()
			for _, key := range l.store.Keys() {
				val, ok := l.store.Peek(key)
				if ok && val != nil && val.IsExpired() {
					val.evictionReason = EvictTTL
					l.store.Remove(key)
				}
			}
			l.executeEviction()
		}
	}
}
```

#### 6. Prometheus metrics for cache hits, misses, and current cache memory.

The Helm caching strategy also moves toward storing compressed chart archives instead of keeping large parsed chart objects in memory. This is expected to significantly reduce the memory footprint of cached Helm charts.

The cache has also been placed in KubeVela's central `pkg` repository, providing a common foundation that can be reused by other components instead of maintaining separate cache implementations.

## Future Outlook

The centralized cache package provides a foundation for bounded caching across KubeVela, but there are still existing cache implementations that can be migrated to use it.

Moving these remaining consumers to the shared cache package will allow more components to benefit from the same byte-based eviction and TTL capabilities while reducing duplicated cache implementations across the project.

As more components adopt the shared cache, it can become a common building block for managing cache across the KubeVela ecosystem.

## Conclusion

Over the course of this mentorship, I had the opportunity to work on a real scalability and resource-management problem in a Kubernetes-based project.

The project took me from understanding KubeVela's reconciliation and Helm provider to designing and integrating a reusable, memory-bounded cache. It also gave me hands-on experience working with Go, Kubernetes, Helm, concurrency, caching, and Prometheus observability in a production-oriented open-source codebase.

I am grateful to my mentors and the KubeVela community for their guidance and reviews throughout the mentorship. Participating in LFX Mentorship has been a great opportunity to contribute to a CNCF project and become more involved in the cloud-native open-source community.
