---
title: Go Client
description: One client-go client that reaches the hub and every member cluster, routing member requests through Cluster Gateway by a cluster name in the context.
---

A controller on the hub doesn't need a kubeconfig per member. The `transport` package in cluster-gateway wraps a client's round tripper: a request whose context names a cluster goes to that cluster's proxy path, and any other request goes to the hub. This is how KubeVela's controller reaches its managed clusters.

Start from the [Quick Start](../getting-started/quick-start.md), steps 1 to 4, and have Go 1.27 or later. The program uses your hub kubeconfig, so it runs as you; in a controller it would be the controller's ServiceAccount, which needs `clustergateways/proxy` on the hub.

## 1. The program

```shell
mkdir multicluster-client && cd multicluster-client
go mod init example.com/multicluster-client
```

`main.go`:

```go
// multicluster-client lists the nodes of the hub and of each member cluster with one client-go client, routing
// requests for a member through Cluster Gateway by the cluster name in the request's context.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	multicluster "github.com/oam-dev/cluster-gateway/pkg/apis/cluster/transport"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	kubeconfig := flag.String("kubeconfig", os.Getenv("KUBECONFIG"), "kubeconfig for the hub")
	flag.Parse()

	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		&clientcmd.ClientConfigLoadingRules{ExplicitPath: *kubeconfig}, &clientcmd.ConfigOverrides{}).ClientConfig()
	if err != nil {
		panic(err)
	}
	// Requests whose context names a cluster go to that cluster's proxy path; the rest go to the hub.
	cfg.Wrap(multicluster.NewClusterGatewayRoundTripper)
	client := kubernetes.NewForConfigOrDie(cfg)

	ctx := context.Background()
	printNodes(ctx, client, "hub")
	for _, cluster := range flag.Args() {
		printNodes(multicluster.WithMultiClusterContext(ctx, cluster), client, cluster)
	}
}

func printNodes(ctx context.Context, client kubernetes.Interface, label string) {
	nodes, err := client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		fmt.Printf("%-8s error: %v\n", label, err)
		return
	}
	for _, node := range nodes.Items {
		fmt.Printf("%-8s %s %s\n", label, node.Name, node.Status.NodeInfo.KubeletVersion)
	}
}
```

```shell
go get github.com/oam-dev/cluster-gateway@v1.10.0-alpha.1
go mod tidy
go build -o mc .
```

The module pulls in client-go 0.37 with it. cluster-gateway's `go.mod` replaces `cloud.google.com/go` and the konnectivity client; Go ignores a dependency's replaces, and this program builds without them. Copy them into yours if `go build` disagrees about those modules.

## 2. Run it

Pass the hub kubeconfig and the clusters to visit. `member-missing` isn't registered, to show what an unknown cluster looks like:

```shell
k3d kubeconfig write hub
./mc --kubeconfig ~/.config/k3d/kubeconfig-hub.yaml member member-missing
```

```console
hub      k3d-hub-server-0 v1.35.5+k3s1
member   k3d-member-server-0 v1.35.5+k3s1
member-missing error: no such cluster member-missing
```

One client, three destinations: the first call has no cluster in its context and goes to the hub, the second is rewritten to `/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy/api/v1/nodes`, and the third is answered by the gateway itself.

## How the routing works

| Call | Round tripper |
| --- | --- |
| `NewClusterGatewayRoundTripper` | Routes by the cluster in the context; with none, sends the request to the hub. Used here, and what you want for controller-runtime clients, which run discovery against the hub. |
| `NewStrictClusterGatewayRoundTripper` | Refuses a request with no cluster in its context (`missing cluster name in the request context`). |
| `NewProxyPathPrependingClusterGatewayRoundTripper(cluster)` | Sends every request to one cluster, for informers and caches that can't carry a context per request. The repository's `examples/single-cluster-informer` uses it. |

`WithMultiClusterContext(ctx, cluster)` puts the cluster name in the context; `GetMultiClusterContext(ctx)` reads it back. The same works with a controller-runtime client built from the wrapped config: the repository's `examples/dynamic-multicluster-client` shows both.

## Clean up

```shell
cd .. && rm -rf multicluster-client
```
