---
title: Principle of Test
---

KubeVela has four kinds of test. Each one proves something the others can't, and each costs more to run than the one before it.

## Where tests live and how to run them

All commands run from the root of the [kubevela](https://github.com/kubevela/kubevela) repository.

| Tier | What it proves | Where it lives | Run it |
| --- | --- | --- | --- |
| Unit | One function or package behaves as designed. | `*_test.go` beside the code | `go test ./pkg/<package>/...` |
| Integration | Packages work together against a real Kubernetes API server ([envtest](https://book.kubebuilder.io/reference/envtest.html)), with no controllers running. | Ginkgo suites (`suite_test.go`) beside the code, under `pkg/` | `make test`, which downloads envtest and sets `KUBEBUILDER_ASSETS`. For one package, run `make envtest` once, then `KUBEBUILDER_ASSETS="$(bin/setup-envtest use 1.37.0 -p path)" go test ./pkg/<package>/...` (the version is `ENVTEST_K8S_VERSION` in `makefiles/dependency.mk`) |
| Definition | Each shipped X-Definition renders what its tests expect. | `*_test.cue` beside the definitions in `vela-templates/definitions/` | `make test-definitions` |
| E2E | The controller, CLI and addons do what a user expects, on a real k3d cluster. | `test/e2e-*` and `e2e/` | `make e2e-test-local` creates the k3d cluster and runs the module suites; each suite also has its own `make e2e-*` target in `makefiles/e2e.mk` |

`make test` runs the unit and integration tiers together, since both are plain `go test`. Without `KUBEBUILDER_ASSETS`, an integration suite fails in `BeforeSuite` without naming the cause.

## Unit Test

The main purposes of writing and maintaining unit tests are:

- Explicit: ensuring that the behavior of functions meets the design expectations. 
- Implicit: facilitating a more reasonable code structure and interface-oriented programming.

Test target of a unit test is a class or a segment of algorithm code. In theory, functions with relatively independent logic should have at least one unit test case (except for getter and setter).

Basic principles for writing a single test are:

- Keep It Simple and Stupid.
- One case covers only one scenario.
- Mock tools (such as `golang/mock`) are powerful, but **NOT recommended**. If you assume that you have to introduce mocking to a unit test, what you really need is an integration test or even an e2e test.

A single test requires high efficiency. For example, during code refactoring, after a function logic is modified, unit tests of the entire module should be triggered to ensure that the modification meets expectations.

## Integration Test

The purpose of an integration test is to ensure the interaction between modules is within expectations by setting up parts of highly associated modules in a system.

Let's use an example to learn how it works. In KubeVela project, integration tests are mainly divided into two categories:

- The vela core controller. Add tests for the main processes: render, orchestrate, and deploy the results into Kubernetes. These run against an envtest API server, so they cover that logic without a full cluster or the other CRD controllers.
- The CLI. Add tests that create, update and delete an Application without the controller acting on it.

Integration test of the core part don't care about how CRDs are working. Therefore, it can mock the CRD controller behavior to speed up test efficiency. While the outside CLI don't care about how applications acted, they just need to ensure the Application has the correct spec.

## E2E Test

The purpose of an e2e test is to simulate the real behaviors of a user, which is suitable for the verification of the whole project.

We recommend e2e test to be added in the following situations:

-  To interact with upstream and downstream projects, for example:
   1. The application controller need to interact with rollout workload for a progressive rollout.
   1. The CLI relies on the response of the controller for next actions in one command.
-  Core Features or Scenarios: each core feature or scenario must have at least one e2e test case.

## Best Practice

The purpose of tests is to ensure the quality of continuous software delivery, with emphasis on the word "continuous". It is necessary to ensure not only the quality of the current delivery, but also the quality of future software delivery. It is particularly important to make good use of the respective advantages of the three test types and combine them to ensure the overall quality of the software.

|  | Time Consumed Running | Test Stability | Can Simulate User behavior |
| --- | --- | --- | --- |
| unit test | minimal | high | no |
| integration test | medium | medium | almost |
| e2e test | much  | low | yes |

Time consumed running is easy to understand here. The larger the scale of software abilities that one test covers, the more time that environment preparation and case running will cost. As a result, the testing efficiency is also lower.
In terms of stability, the higher the case coverage is, the more problems it may encounter, and some problems are not real bugs we want to discover, but merely noises. When simulating real user behavior, only e2e can cover end-to-end to ensure that the entire link can work together.

As for the long-term value, it refers to the value of the existing case in continuous software iteration processes. For unit tests, during code refactoring, it is adjusted according to the changes of classes and functions. As a result, the code base is consistent with the hot spots in software iterations and continues to evolve. 

However, integration/e2e test is usually split into subsystem boundaries, whose external interfaces are relatively stable (there are very few functional changes during the software iteration of distributed systems, generally for forward compatibility). The code base of Integration/e2e tests is relatively stable, which is very important in the future evolution of the system. It can timely discover whether new functions damage existing functions.

Combined with the characteristics of all three, the best way to balance is to comply with the pyramid model. The chassis is unittest, the middle is integration test, and the top layer is e2e.

```
             \                        
            / \                       
           /   \                      
          /     \                     
         /  e2e  \                    
        /---------\                   
       /           \                  
      / integration \                 
     /               \                
    /-----------------\               
   /                   \              
  /      unit-test      \             
 /                       \            
---------------------------           
```

KubeVela would like to follow the 70/20/10 principle, that is, 70% unittest, 20% integration test, and 10% e2e test. Each module has some differences. However, the higher the upper layer, the larger the test coverage, but the smaller the test case set. This pyramid model remains unchanged. The following situations need to be avoided:
-  Inverted pyramid, all rely on e2e to build the test
-  Hourglass model, a large number of unit + e2e test, but no integration test

It's hard to keep the test quality as we mainly focus on features instead of the stability. But for all of our maintainers, it's our duty to keep the test in good quality to ensure the community runs well in the long term.