"my-stateful": {
	annotations: {}
	attributes: workload: definition: {
		apiVersion: "apps/v1"
		kind:       "StatefulSet"
	}
	description: "My StatefulSet component."
	labels: {}
	type: "component"
}

template: {
	output: {
		apiVersion: "apps/v1"
		kind:       "StatefulSet"
		metadata: name: context.name
		spec: {
			selector: matchLabels: app: "nginx"
			replicas:    parameter.replicas
			serviceName: parameter.name
			template: {
				metadata: labels: app: "nginx"
				spec: {
					containers: [{
						name: "nginx"
						ports: [{
							name:          "web"
							containerPort: 80
						}]
						image: parameter.image
						volumeMounts: [{
							name:      "www"
							mountPath: "/usr/share/nginx/html"
						}]
					}]
					terminationGracePeriodSeconds: 10
				}
			}
			volumeClaimTemplates: [{
				metadata: name: "www"
				spec: {
					accessModes: ["ReadWriteOnce"]
					resources: requests: storage: "1Gi"
					storageClassName: "my-storage-class"
				}
			}]
		}
	}
	outputs: web: {
		apiVersion: "v1"
		kind:       "Service"
		metadata: {
			name: parameter.name
			labels: app: "nginx"
		}
		spec: {
			clusterIP: "None"
			ports: [{
				name: "web"
				port: 80
			}]
			selector: app: "nginx"
		}
	}
	parameter: {
		image: string
		name: string
		replicas: int
	}
}
