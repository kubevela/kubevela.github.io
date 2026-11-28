---
title: Canary a Controller Upgrade
---

Upgrading the KubeVela controller changes how every Application is handled at once. To try a new version on a few Applications first, run it beside the current controller as a canary, and move Applications to it one at a time with the `app.oam.dev/controller-version-require` annotation.

:::tip
Canary or sharding?

- Use a **canary**, as on this page, to upgrade: the new version handles only the Applications you annotate, and the rest stay on the current controller until you upgrade it.
- Use [controller sharding](./controller-sharding.md) to split Applications across controllers for scale. Shards may run different image versions too, but Applications are assigned to shards by the webhook, not by version.
:::

## How it works

An Application annotated with `app.oam.dev/controller-version-require: <version>` is handled only by the controller whose version matches. An Application without the annotation is handled by any controller, unless that controller runs with `--ignore-app-without-controller-version`, which makes it skip them.

`--ignore-app-without-controller-version` also adds the controller's version to its leader-election lease name (`kubevela-v1-12-0` instead of `kubevela`), so the canary holds its own lease and doesn't compete with the current controller for leadership.

Its sibling, `--ignore-definition-without-controller-version`, does the same for ComponentDefinitions, TraitDefinitions, PolicyDefinitions and WorkflowStepDefinitions: the controller skips definitions without the same annotation.

## Upgrade with a canary

Say the current controller runs v1.11.2 and you want to upgrade to v1.12.0.

1. Create the canary by copying the installed Deployment, with a new name, a new pod label, the new image and `--ignore-app-without-controller-version`. This needs [yq](https://github.com/mikefarah/yq) v4:

    ```bash
    kubectl get deploy kubevela-vela-core -n vela-system -o yaml | yq '
      .metadata.name = "kubevela-vela-core-canary" |
      del(.metadata.uid, .metadata.resourceVersion, .metadata.creationTimestamp, .metadata.generation, .metadata.annotations, .status) |
      .spec.replicas = 1 |
      .spec.selector.matchLabels."app.kubernetes.io/name" = "vela-core-canary" |
      .spec.template.metadata.labels."app.kubernetes.io/name" = "vela-core-canary" |
      .spec.template.spec.containers[0].image = "oamdev/vela-core:v1.12.0" |
      .spec.template.spec.containers[0].args += ["--ignore-app-without-controller-version"]' | kubectl apply -f -
    ```

    Copying keeps every flag and feature gate you installed with. The new `app.kubernetes.io/name` label keeps the canary's pods out of the main Deployment's selector and out of the webhook Service, so admission still goes to the current controller. Its leader-election lease is separate, because `--ignore-app-without-controller-version` adds the version to the lease name.

2. Check that both controllers are running:

    ```shell
    kubectl get deployment -n vela-system -o wide
    ```

    ```
    NAME                        READY   UP-TO-DATE   AVAILABLE   AGE    CONTAINERS                           IMAGES                                  SELECTOR
    kubevela-cluster-gateway    1/1     1            1           4d2h   kubevela-vela-core-cluster-gateway   oamdev/cluster-gateway:v1.9.2           app.kubernetes.io/instance=kubevela-cluster-gateway,app.kubernetes.io/name=vela-core-cluster-gateway
    kubevela-vela-core          1/1     1            1           4d2h   kubevela                             oamdev/vela-core:v1.11.2                app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core
    kubevela-vela-core-canary   1/1     1            1           63m    kubevela                             oamdev/vela-core:v1.12.0                app.kubernetes.io/instance=kubevela,app.kubernetes.io/name=vela-core-canary
    ```

3. Choose an Application and annotate it with the canary's version. From now on, the canary handles it:

    ```shell
    kubectl annotate application test app.oam.dev/controller-version-require=v1.12.0
    ```

    You can also create new Applications with the annotation:

    ```yaml
    apiVersion: core.oam.dev/v1beta1
    kind: Application
    metadata:
      name: test
      annotations:
        app.oam.dev/controller-version-require: v1.12.0
    spec:
      components:
        - type: webservice
          name: test
          properties:
            image: nginx
    ```

4. Check the logs. The current controller logs that it skips the Application, and the canary's logs show it handling it:

    ```
    I0110 10:12:30.034066       1 application_controller.go:162] "skip app: not match the controller requirement of app" application="default/test" controller="application"
    ```

5. Once the Application works as expected, annotate more Applications to move them to the canary.

6. When every Application is on the canary, upgrade the main controller with `helm upgrade` or `vela install`. Then delete the canary Deployment, and remove the annotations if you want any controller to handle the Applications again.

If anything goes wrong along the way, scale the canary to 0 replicas. Applications still on the current controller are not affected.

:::caution
A canary has limits:

1. CRDs can't be canaried: there is one set per cluster. If the two versions need different CRDs, this won't work. Apply the new version's CRDs first only if the old controller works with them.
2. Each controller handles only its own Applications, but each still caches everything it watches, so running two roughly doubles the controllers' memory use while the upgrade is in progress.
:::
