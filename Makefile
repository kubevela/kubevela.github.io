update-version:
	sh ./hack/version.sh $(version)

check-link:
	go run ./hack/linkcheck.go

# Generate the cloud resource table http://kubevela.net/docs/end-user/components/cloud-services/cloud-resources-list
cloud-resource-table:
	cd hack && go run cloud-resources/terraform/gen.go