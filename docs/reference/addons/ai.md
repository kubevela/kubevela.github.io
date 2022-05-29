---
title: Machine Learning
---

Machine learning addon is divided into model-training addon and model-serving addon. Run the following command to install the addon:

```shell
vela addon enable model-training
vela addon enable model-serving
```

## Model-training addon

In model-training addon, we have two component definitions: `model-training` and `jupyter notebook`.

### model-training

```bash
$ vela show model-training
# Properties
+------------------+----------------------------------------------------------------------------------+-------------------------------+----------+---------+
|       NAME       |                                   DESCRIPTION                                    |             TYPE              | REQUIRED | DEFAULT |
+------------------+----------------------------------------------------------------------------------+-------------------------------+----------+---------+
| env              | Define arguments by using environment variables                                  | [[]env](#env)                 | false    |         |
| labels           | Specify the labels in the workload                                               | map[string]string             | false    |         |
| annotations      | Specify the annotations in the workload                                          | map[string]string             | false    |         |
| framework        | The training framework to use                                                    | string                        | true     |         |
| image            | Which image would you like to use for your service                               | string                        | true     |         |
| imagePullPolicy  | Specify image pull policy for your service                                       | string                        | false    |         |
| cpu              | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core) | string                        | false    |         |
| memory           | Specifies the attributes of the memory resource required for the container.      | string                        | false    |         |
| gpu              | Specifies the attributes of the gpu resource required for the container.         | string                        | false    |         |
| storage          |                                                                                  | [[]storage](#storage)         | false    |         |
| imagePullSecrets | Specify image pull secrets for your service                                      | []string                      | false    |         |
| distribution     | If you want to train the model in distributed mode, specify here                 | [distribution](#distribution) | false    |         |
| restartPolicy    |                                                                                  | string                        | true     | Never   |
+------------------+----------------------------------------------------------------------------------+-------------------------------+----------+---------+


## distribution
+-----------+---------------------------------------------------------+------+----------+---------+
|   NAME    |                       DESCRIPTION                       | TYPE | REQUIRED | DEFAULT |
+-----------+---------------------------------------------------------+------+----------+---------+
| ps        | The number of PS replicas, suits for tensorflow model   | int  | false    |         |
| master    | The number of Master replicas, suits for pytorch model  | int  | false    |         |
| scheduler | The number of Scheduler replicas, suits for mxnet model | int  | false    |         |
| server    | The number of Server replicas, suits for mxnet model    | int  | false    |         |
| launcher  | The number of Launcher replicas, suits for mpi model    | int  | false    |         |
| worker    | The number of Worker replicas                           | int  | false    |         |
+-----------+---------------------------------------------------------+------+----------+---------+


## storage
+------------------+--------------------------------------------------------------------------+---------------------------------+----------+------------+
|       NAME       |                               DESCRIPTION                                |              TYPE               | REQUIRED |  DEFAULT   |
+------------------+--------------------------------------------------------------------------+---------------------------------+----------+------------+
| name             |                                                                          | string                          | false    |            |
| resources        |                                                                          | [resources](#resources)         | false    |            |
| pvcRef           | If you want to use a existed PVC, specify the PVC name and moutPath here | [pvcRef](#pvcRef)               | false    |            |
| mountPath        |                                                                          | string                          | false    |            |
| accessModes      |                                                                          | [...]                           | true     |            |
| volumeMode       |                                                                          | string                          | true     | Filesystem |
| storageClassName |                                                                          | string                          | false    |            |
| dataSourceRef    |                                                                          | [dataSourceRef](#dataSourceRef) | false    |            |
| dataSource       |                                                                          | [dataSource](#dataSource)       | false    |            |
| selector         |                                                                          | [selector](#selector)           | false    |            |
+------------------+--------------------------------------------------------------------------+---------------------------------+----------+------------+
```

### jupyter-notebook

```bash
$ vela show jupyter-notebook
# Properties
+-------------+------------------------------------------------------------------------------------------------------+-----------------------+----------+-----------+
|    NAME     |                                             DESCRIPTION                                              |         TYPE          | REQUIRED |  DEFAULT  |
+-------------+------------------------------------------------------------------------------------------------------+-----------------------+----------+-----------+
| cpu         | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core)                     | string                | false    |           |
| memory      | Specifies the attributes of the memory resource required for the container.                          | string                | false    |           |
| gpu         | Specifies the attributes of the gpu resource required for the container.                             | string                | false    |           |
| storage     |                                                                                                      | [[]storage](#storage) | false    |           |
| serviceType | Specify what kind of Service you want. options: "ClusterIP","NodePort","LoadBalancer","ExternalName" | string                | true     | ClusterIP |
+-------------+------------------------------------------------------------------------------------------------------+-----------------------+----------+-----------+


## storage
+-----------+-------------+--------+----------+---------+
|   NAME    | DESCRIPTION |  TYPE  | REQUIRED | DEFAULT |
+-----------+-------------+--------+----------+---------+
| name      |             | string | true     |         |
| mountPath |             | string | true     |         |
+-----------+-------------+--------+----------+---------+
```

## Model-serving addon

In model-serving addon, we have on component definition called `model-serving` to serve the models.

### model-serving

```bash
$ vela show model-serving
# Properties
+---------------+-----------------------------------------------------------------------+---------------------------------+----------+---------+
|     NAME      |                              DESCRIPTION                              |              TYPE               | REQUIRED | DEFAULT |
+---------------+-----------------------------------------------------------------------+---------------------------------+----------+---------+
| timeout       | If you model serving need long time to return, please set the timeout | string                          | false    |         |
| customRouting | Specify the custom routing of the serving                             | [customRouting](#customRouting) | false    |         |
| protocol      | Protocol of model serving, default to seldon                          | string                          | false    |         |
| predictors    | The predictors of the serving                                         | [[]predictors](#predictors)     | true     |         |
+---------------+-----------------------------------------------------------------------+---------------------------------+----------+---------+


## predictors
+------------+------------------------------------------------------------------------------------+---------------------------+----------+---------+
|    NAME    |                                    DESCRIPTION                                     |           TYPE            | REQUIRED | DEFAULT |
+------------+------------------------------------------------------------------------------------+---------------------------+----------+---------+
| name       | Name of the predictor                                                              | string                    | true     |         |
| replicas   | Replica of the predictor                                                           | int                       | false    |         |
| traffic    | If you want to split the traffic to different serving, please set the traffic here | int                       | false    |         |
| graph      | The graph of the predictor                                                         | [graph](#graph)           | true     |         |
| resources  | The resources of the serving                                                       | [resources](#resources)   | false    |         |
| autoscaler | The autoscaler of the serving                                                      | [autoscaler](#autoscaler) | false    |         |
+------------+------------------------------------------------------------------------------------+---------------------------+----------+---------+


### autoscaler
+-------------+--------------------------------------+-----------------------+----------+---------+
|    NAME     |             DESCRIPTION              |         TYPE          | REQUIRED | DEFAULT |
+-------------+--------------------------------------+-----------------------+----------+---------+
| minReplicas | The min replicas of this auto scaler | int                   | true     |         |
| maxReplicas | The max replicas of this auto scaler | int                   | true     |         |
| metrics     | The metrics of this auto scaler      | [[]metrics](#metrics) | true     |         |
+-------------+--------------------------------------+-----------------------+----------+---------+


#### metrics
+--------------------------+----------------------------------------------------+--------+----------+---------+
|           NAME           |                    DESCRIPTION                     |  TYPE  | REQUIRED | DEFAULT |
+--------------------------+----------------------------------------------------+--------+----------+---------+
| type                     | The type of this auto scaler                       | string | true     |         |
| targetAverageUtilization | The target average utilization of this auto scaler | int    | true     |         |
+--------------------------+----------------------------------------------------+--------+----------+---------+


### resources
+--------+----------------------------------------------------------------------------------+--------+----------+---------+
|  NAME  |                                   DESCRIPTION                                    |  TYPE  | REQUIRED | DEFAULT |
+--------+----------------------------------------------------------------------------------+--------+----------+---------+
| cpu    | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core) | string | false    |         |
| memory | Specifies the attributes of the memory resource required for the container.      | string | false    |         |
| gpu    | Specifies the attributes of the gpu resource required for the container.         | string | false    |         |
+--------+----------------------------------------------------------------------------------+--------+----------+---------+


### graph
+----------------+-------------------------------------------------------------------------------+--------+----------+---------+
|      NAME      |                                  DESCRIPTION                                  |  TYPE  | REQUIRED | DEFAULT |
+----------------+-------------------------------------------------------------------------------+--------+----------+---------+
| name           | The name of the graph                                                         | string | true     |         |
| implementation | The implementation of the serving                                             | string | true     |         |
| modelUri       | The model uri, you can use `pvc://pvc-name/path` or `s3://s3-name/path`, etc. | string | true     |         |
+----------------+-------------------------------------------------------------------------------+--------+----------+---------+


## customRouting
+-------------+-----------------------------------------------------------------------+--------+----------+---------+
|    NAME     |                              DESCRIPTION                              |  TYPE  | REQUIRED | DEFAULT |
+-------------+-----------------------------------------------------------------------+--------+----------+---------+
| header      | Request with specified header will be routed to the specified service | string | true     |         |
| serviceName | The service name that will be routed to                               | string | true     |         |
+-------------+-----------------------------------------------------------------------+--------+----------+---------+
```