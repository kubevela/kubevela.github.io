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

## Helm Component in KubeVela

Helm is widely used in the Kubernetes ecosystem to package and distribute applications. A Helm chart packages the Kubernetes resources and configuration required to deploy an application.

KubeVela allows applications to be composed using different **Component** types, where each component forms part of an application.

Historically, KubeVela's `helm` Component was provided through the **FluxCD addon**. The addon included the Helm ComponentDefinition and the FluxCD controllers required for Helm chart delivery. Users who wanted to deploy a Helm chart through KubeVela therefore had to enable the FluxCD addon first.

With the introduction of KubeVela's **native Helm provider**, Helm charts can be handled directly by KubeVela without relying on the FluxCD addon. The native provider can fetch and process charts from sources such as Helm repositories, OCI registries, and chart URLs.

This also means that Helm chart fetching and processing happen directly as part of KubeVela's application reconciliation.

```yaml
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

## Project Details

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

The mentorship resulted in a reusable, memory-bounded caching foundation for KubeVela, with the native Helm provider as the primary use case.

The implementation addressed the original problem of unbounded cache growth by combining LRU eviction with byte-based capacity and TTL-based expiration. This allows the cache to retain frequently used entries while keeping its memory consumption within a configurable limit.

The main capabilities include:

#### 1. Generic LRU caching with configurable byte limits.

```go
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

```go
type lruCache[V any] struct {
	data           V
	cacheDuration  time.Duration
	startTime      time.Time
	memorySize     int64
	evictionReason EvictionReason
}
```

#### 3. Byte-pressure eviction based on the configured memory budget.

![Byte Pressure Eviction](/img/blog/lfx-helm-lru-cache/byte-pressure-eviction.png)

#### 4. Periodic background cleanup.


```go
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
![Background sweep](/img/blog/lfx-helm-lru-cache/background-sweep.png)

#### 5. Observability
Making the cache memory-bounded was only part of the problem; it was also important to make its behavior visible. Prometheus metrics were added to track cache hits, misses, evictions and eviction reasons, along with current memory usage. This provides visibility into how the cache behaves during reconciliation and how much memory it is actually retaining.

These capabilities together make the cache more predictable and easier to operate: frequently used entries can remain cached, stale entries can expire, memory pressure can trigger eviction, and the resulting behavior can be observed through metrics.

For the Helm provider, the caching strategy also moves toward storing compressed chart archives rather than retaining large parsed chart objects in memory. This adds another layer of memory optimization by reducing the amount of data that needs to remain resident in the controller.

The cache has also been placed in KubeVela's central `pkg` repository, making it a reusable building block for other components instead of maintaining separate cache implementations across the project.

## Cache in Action
<video controls width="700" align="center">
  <source src="/img/blog/lfx-helm-lru-cache/lru-cache-demo.mp4" type="video/mp4"/>
  Your browser does not support the video tag.
</video>

## Future Outlook

The centralized cache package provides a foundation for bounded caching across KubeVela, but there are still existing cache implementations that can be migrated to use it.

Moving these remaining consumers to the shared cache package will allow more components to benefit from the same byte-based eviction and TTL capabilities while reducing duplicated cache implementations across the project.

As more components adopt the shared cache, it can become a common building block for managing cache across the KubeVela ecosystem.

## Conclusion

What started as a problem of unbounded Helm chart caching turned into an opportunity to understand a much larger part of KubeVela's architecture.

Throughout the mentorship, I worked across the reconciliation flow, native Helm provider, shared caching infrastructure, concurrency, memory management, and Prometheus observability. More importantly, I experienced how an open-source engineering problem evolves from an issue into a design, implementation, review, and integration within an existing project.

The final result was a reusable LRU cache with a configurable memory boundary that can be used beyond the Helm provider, while providing the foundation for more predictable cache behavior across KubeVela.

Working on KubeVela also gave me a better understanding of the engineering challenges involved in building infrastructure around Kubernetes. Instead of solving a problem in isolation, I had to consider existing abstractions, compatibility with other components, maintainability, and how the solution could be useful to the wider project.

I am grateful to my mentors [Ayush Kumar](https://github.com/roguepikachu) and [Vishal Kumar](https://github.com/vishal210893) and the KubeVela community for their guidance and reviews throughout the mentorship. Participating in LFX Mentorship has been a great opportunity to contribute to a CNCF project and become more involved in the cloud-native open-source community.
