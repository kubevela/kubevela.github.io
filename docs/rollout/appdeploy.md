---
title: AppDeployment Tutorial
---

The files needed for the tutorial are in [`docs/examples/appdeployment`](https://github.com/oam-dev/kubevela/tree/master/docs/examples/appdeployment), 
please execute the cmds of this tutorial in this path.

1. Create an Application

   ```shell
   $ cat <<EOF | kubectl apply -f -
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: example-app
     annotations:
       app.oam.dev/revision-only: "true"
   spec:
     components:
       - name: testsvc
         type: webservice
         properties:
           image: crccheck/hello-world
           port: 8000
   EOF
   ```

   This will create `example-app-v1` AppRevision. Check it:

   ```shell
   $ kubectl get applicationrevisions.core.oam.dev
   NAME             AGE
   example-app-v1   116s
   ```

   With above annotation this won't create any pod instances.

1. Then use the above AppRevision to create an AppDeployment.

   ```shell
   $ kubectl apply -f appdeployment-1.yaml
   ```

   > Note that in order to AppDeployment to work, your workload object must have a `spec.replicas` field for scaling.

1. Now you can check that there will 1 deployment and 2 pod instances deployed

   ```shell
   $ kubectl get deploy
   NAME         READY   UP-TO-DATE   AVAILABLE   AGE
   testsvc-v1   2/2     2            0           27s
   ```

1. Update Application properties:

   ```shell
   $ cat <<EOF | kubectl apply -f -
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: example-app
     annotations:
       app.oam.dev/revision-only: "true"
   spec:
     components:
       - name: testsvc
         type: webservice
         properties:
           image: nginx
           port: 80
   EOF
   ```

   This will create a new `example-app-v2` AppRevision. Check it:

   ```shell
   $ kubectl get applicationrevisions.core.oam.dev
   NAME
   example-app-v1
   example-app-v2
   ```

1. Then use the two AppRevisions to update the AppDeployment:

   ```shell
   $ kubectl apply -f appdeployment-2.yaml
   ```

   (Optional) If you have Istio installed, you can apply the AppDeployment with traffic split:

   ```shell
   # set up gateway if not yet
   $ kubectl apply -f gateway.yaml

   $ kubectl apply -f appdeployment-2-traffic.yaml
   ```

   Note that for traffic split to work, your must have the following labels set in pods (This is automatically set in default `webservice` workload template):

   ```shell
   "app.oam.dev/component": "testsvc"
   "app.oam.dev/appRevision": "example-app-v1"
   ```

1. Now you can check that there will 1 deployment and 1 pod per revision.

   ```shell
   $ kubectl get deploy
   NAME         READY   UP-TO-DATE   AVAILABLE   AGE
   testsvc-v1   1/1     1            1           2m14s
   testsvc-v2   1/1     1            1           8s
   ```

   (Optional) To verify traffic split:

   ```shell
   # run this in another terminal
   $ kubectl -n istio-system port-forward service/istio-ingressgateway 8080:80
   Forwarding from 127.0.0.1:8080 -> 8080
   Forwarding from [::1]:8080 -> 8080

   # The command should return pages of either docker whale or nginx in 50/50
   $ curl -H "Host: example-app.example.com" http://localhost:8080/
   ```

1. Cleanup:

   ```shell
   kubectl delete appdeployments.core.oam.dev  --all
   kubectl delete applications.core.oam.dev --all
   ```
