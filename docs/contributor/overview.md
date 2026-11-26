---
title: Developer Overview
---

This guide is for contributing to KubeVela itself: code, docs, issues and community work. If you want to extend KubeVela for your own platform instead, start with [Build Your Own Addon](../platform-engineers/addon/intro.md) and [Manage Definitions with CUE](../platform-engineers/cue/basic.md).

## Contribution Guide

KubeVela is a CNCF project, with open governance; see [GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md).

Two things apply to everyone. To help us create a safe and positive community experience for all, we require all participants adhere to the CNCF Community [Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md). And every contribution requires you to sign off your commits under the Developer Certificate of Origin, see [Sign Your Commits (DCO)](./code-contribute.md#sign-your-commits-dco) for how to do that.

The sections below walk you through contributing.

### First-time contributor checklist

If you're contributing code for the first time, work through these in order:

1. Read the CNCF Community [Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).
2. Set up your local development environment by following [Run KubeVela Locally](./code-contribute.md#run-kubevela-locally).
3. Pick up something to work on from the [good first issue](https://github.com/kubevela/kubevela/labels/good%20first%20issue) list, comment on the issue to request assignment, and wait for a maintainer to assign it to you before starting work or raising a pull request.
4. Sign off your commits with `git commit -s`, see [Sign Your Commits (DCO)](./code-contribute.md#sign-your-commits-dco).
5. Run `make reviewable` before you open the pull request, see [Your first pull request](./code-contribute.md#your-first-pull-request).

### Become a contributor

You can contribute to KubeVela in several ways including code and non-code contributions,
we appreciate every effort you contribute to the community. Here are some examples:

* Contribute to the codebase and docs.
* Report and triage issues.
* Organize meetups and user groups in your local area.
* Help others by answering questions about KubeVela.

### Communication

The community talks on the CNCF Slack channel [`#kubevela`](https://cloud-native.slack.com/archives/C01BLQ3HTJA), on DingTalk and WeChat groups, and in the weekly community meetings. The joining links, group IDs and meeting schedule all live in one place, see [community communication](https://github.com/kubevela/community#communication).

### Non-code contribution

The Apache way says "Community Over Code". Although KubeVela is a CNCF/Linux project, we possess a strong resonance to it. To second and stretch this merit deeper, we regard non-coding contribution as equally important with code contribution for the community's very existence and its future growth.

- Refer to [Non-code Contribution Guide](./non-code-contribute.md) to know how you could help.

### Code contribution

Unsure where to begin contributing to KubeVela codebase? Start by browsing issues labeled `good first issue`, `help wanted` or `triage/accepted`.

- [Good first issue](https://github.com/kubevela/kubevela/labels/good%20first%20issue) issues are generally straightforward to complete.
- [Help wanted](https://github.com/kubevela/kubevela/labels/help%20wanted) issues are problems we would like the community to help us with regardless of complexity.
- [Triage/accepted](https://github.com/kubevela/kubevela/labels/triage%2Faccepted) issues are ready to be actively worked on.
- Once you find an issue you want to work on (or after filing a new issue), leave a comment on the issue and get it assigned to you by a maintainer before starting work or raising a pull request. Unless you are a maintainer, a pull request without an assigned issue will not be picked up and may be closed.
- Refer to [Code Contribution Guide](./code-contribute.md) for more details.

Learn the [Release Process And Cadence](./release-process.md) to know when your code changes will be released.

### Security

If you find a security vulnerability, report it privately as described in the [security policy](https://github.com/kubevela/kubevela/blob/master/SECURITY.md) rather than filing a public issue.

### Governance & membership

KubeVela has a role ladder that goes Member, Reviewer, Approver, Maintainer, with each step carrying more review and approval responsibility for the project. Roles are earned through sustained contribution, and the requirements for each one are written down in [community membership](https://github.com/kubevela/community/blob/main/community-membership.md).

To see who currently holds which role, check [OWNERS](https://github.com/kubevela/community/blob/main/OWNERS.md). For how the project makes decisions, read the [governance](https://github.com/kubevela/community/blob/main/GOVERNANCE.md) document.

### Contribute to other community projects

* [VelaUX Developer Guide](https://github.com/kubevela/velaux/blob/main/CONTRIBUTING.md)
* [Terraform Controller Developer Guide](https://github.com/oam-dev/terraform-controller/blob/master/CONTRIBUTING.md)
