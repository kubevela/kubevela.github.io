---
title: Call an HTTP API and Use the Answer
description: "A WorkflowRun that calls the GitHub API with the request step, turns the reply into an output, hands it to the next step, and runs a fallback step when the call fails."
---

This WorkflowRun asks the GitHub API about the `kubevela/workflow` repository, builds a sentence from the reply, and hands it to the next step. If the call fails, a different step runs instead. The same pattern sends the result on to Slack or a webhook: swap the last step for a [`notification`](../reference/built-in-steps.md#notification) step.

**Needs:** the `vela-workflow` controller ([Install](../getting-started/install.md)), and a cluster that can reach `api.github.com`.

## The WorkflowRun

```yaml title="github-stars.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: github-stars
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: request
        type: request
        properties:
          url: https://api.github.com/repos/kubevela/workflow
        outputs:
          - name: stars
            valueFrom: '"\(response.full_name) has \(response.stargazers_count) stars"'
      - name: report
        type: print-message-in-status
        inputs:
          - from: stars
            parameterKey: message
      - name: report-failure
        type: print-message-in-status
        if: status.request.failed
        properties:
          message: "Could not read the repository from GitHub"
```

- **`request`** sends a GET and waits for the reply. It parses a JSON body into `response`, which `valueFrom` reads: here, CUE string interpolation over two of its fields.
- **`report`** takes the output as its `message`, through `inputs`.
- **`report-failure`** has an `if`, so it runs when the condition holds rather than only when everything before it succeeded.

## Run it

```shell
kubectl apply -f github-stars.yaml
kubectl get workflowrun github-stars
```

```console
NAME           PHASE       AGE
github-stars   succeeded   6s
```

Each step's phase and message:

```shell
kubectl get workflowrun github-stars \
  -o jsonpath='{range .status.steps[*]}{.name}{"\t"}{.phase}{"\t"}{.message}{"\n"}{end}'
```

```console
request	succeeded
report	succeeded	kubevela/workflow has 127 stars
report-failure	skipped
```

The star count is whatever GitHub says when you run it.

## When the call fails

Point the URL at a repository that doesn't exist, `https://api.github.com/repos/kubevela/no-such-repo`, and name the run `github-stars-missing`. GitHub answers 404, the `request` step fails, `report` is skipped since it needs `request` to succeed, and `report-failure` runs:

```console
NAME                   PHASE    AGE
github-stars-missing   failed   6s
```

```console
request	failed	request of https://api.github.com/repos/kubevela/no-such-repo is fail: 404
report	skipped
report-failure	succeeded	Could not read the repository from GitHub
```

The run is `failed` because one of its steps failed, even though the fallback ran.

## Clean up

```shell
kubectl delete workflowrun github-stars github-stars-missing
```

## Read more

- [Data Passing](../guides/steps/inputs-outputs.md): `outputs`, `inputs` and `valueFrom`.
- [If Conditions](../guides/steps/if-condition.md): every variable an `if` can read.
- [Workflow Outbound HTTP Protection](../operate/http-protection.md): which destinations an HTTP step may call, and the timeout and size limits.
