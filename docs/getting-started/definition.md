---
title: Definition
---

Definition are the basic building block of the KubeVela platform. A definition encapsulates an arbitrarily complex automation as a lego style module that can be used to compose an Application, then safely shared, and repeatably executed by any KubeVela engine.

There're four types of Definition, they're `ComponentDefinition`, `TraitDefinition`, `PolicyDefinition` and `WorkflowStepDefinition`, corresponding to the application concepts.

## Sources of Definitions

There're two sources of definitions:

* Built-in definitions will be installed along with KubeVela helm chart. You can refer to the following links to learn more about built-in definitions.
    - [Component Definition](../end-user/components/references)
    - [Trait Definition](../end-user/traits/references)
    - [Policy Definition](../end-user/policies/references)
    - [Workflow Step Definition](../end-user/workflow/built-in-workflow-defs)
* Installation of addons will install definitions if there're new capabilities contained. You can refer to [the official addon registry](../reference/addons/overview) for more details.

## Lifecycle of a Definition

A definition's lifecycle usually has 3 stages:

### Discovery

### Use

### Customize

> ⚠️ In most cases, you don't need to customize any definitions unless you're going to extend the capability of KubeVela. Before that, you should check the built-in definitions and addons to confirm if they can fit your needs.

A new definition is built in a declarative template in [CUE configuration language](https://cuelang.org/). If you're not familiar with CUE, you can refer to [CUE Basic](../platform-engineers/cue/basic) for some knowledge. 

## Next Step

- View [Architecture](./architecture) to learn the overall architecture of KubeVela.
