---
title: Machine Learning
---

The `model-training` addon runs machine learning training jobs and Jupyter notebooks as KubeVela components. It installs the [Kubeflow training operator](https://github.com/kubeflow/training-operator) and gives you two component types:

- `model-training`: a training job for TensorFlow, PyTorch, MPI, XGBoost or MXNet, run by the training operator (`TFJob`, `PyTorchJob` and so on).
- `jupyter-notebook`: a Jupyter notebook server, with a Service in front of it.

:::caution
The `model-serving` addon, which served trained models with Seldon, requires Kubernetes older than 1.22 (`system.kubernetes: <1.22` in its metadata), and `vela addon enable` refuses it on any cluster KubeVela 1.12 supports.
:::

## Install

The addon installs the training operator with the `helm` component type, so it depends on the [fluxcd](./fluxcd.md) addon, which is enabled with it:

```shell
vela addon enable model-training
```

To remove it:

```shell
vela addon disable model-training
```

## Train a model

This Application trains a small TensorFlow model and saves it to a PersistentVolumeClaim, `my-pvc`, which the component creates from the default storage class:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: training
  namespace: default
spec:
  components:
    - name: demo-training
      type: model-training
      properties:
        image: fogdong/train-color:v1
        framework: tensorflow
        storage:
          - name: my-pvc
            mountPath: /model
```

Save it as `training.yaml` and deploy it:

```shell
vela up -f training.yaml
```

The component renders a `TFJob` named after it. Watch it run to completion:

```shell
kubectl get tfjob demo-training -n default
```

To train in distributed mode, set `distribution`, for example `distribution: {ps: 1, worker: 2}` for TensorFlow.

## Open a notebook

This Application runs a notebook with the trained model mounted under `/home/jovyan/model`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: notebook
  namespace: default
spec:
  components:
    - name: demo-notebook
      type: jupyter-notebook
      properties:
        storage:
          - name: my-pvc
            mountPath: /model
```

The notebook mounts existing PersistentVolumeClaims only, and its template fails to render without `storage`, so give it at least one claim. Deploy it and forward its Service:

```shell
vela up -f notebook.yaml
kubectl port-forward -n default svc/demo-notebook 8888:8888
```

Then open http://127.0.0.1:8888. The notebook runs with no token, so don't expose its Service outside the cluster.

## Parameters

### model-training

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `framework` | The training framework to use. | `"tensorflow"`, `"pytorch"`, `"mpi"`, `"xgboost"` or `"mxnet"` | false | `"tensorflow"` |
| `image` | The image that runs the training. | string | true | |
| `distribution` | Replica counts for distributed training: `ps` (TensorFlow), `master` (PyTorch), `scheduler` and `server` (MXNet), `launcher` (MPI), `worker` (all). Without it, one worker runs. | object | false | |
| `restartPolicy` | The restart policy of the training pods. | `"Never"`, `"OnFailure"` or `"Always"` | false | `"Never"` |
| `env` | Environment variables, as in `webservice`. | []object | false | |
| `cpu` | CPU for the container, such as `0.5`. | string | false | |
| `memory` | Memory for the container, such as `1Gi`. | string | false | |
| `gpu` | Number of NVIDIA GPUs (`nvidia.com/gpu`). | string | false | |
| `storage` | Volumes to mount. Each entry creates a PersistentVolumeClaim (`name`, `mountPath`, and optionally `storageClassName`, `accessModes`, `resources.requests.storage`, default `1Gi`), or mounts an existing one with `pvcRef: {name, mountPath}`. | []object | false | |
| `labels`, `annotations` | Labels and annotations for the training pods. | map[string]string | false | |
| `imagePullPolicy` | `Always`, `Never` or `IfNotPresent`. | string | false | |
| `imagePullSecrets` | Image pull secrets for the training pods. | []string | false | |

### jupyter-notebook

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `storage` | Existing PersistentVolumeClaims to mount, each as `name` (the claim) and `mountPath` (under `/home/jovyan`). | []object | true in practice | |
| `serviceType` | The type of the notebook's Service. | `"ClusterIP"`, `"NodePort"`, `"LoadBalancer"` or `"ExternalName"` | false | `"ClusterIP"` |
| `cpu` | CPU for the container. | string | false | |
| `memory` | Memory for the container. | string | false | |
| `gpu` | Number of NVIDIA GPUs (`nvidia.com/gpu`). | string | false | |
