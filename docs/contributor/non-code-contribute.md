---
title: Non-code Contribution Guide
---

You don't need to write Go to help KubeVela. Pick whichever of these suits you.

## Share how you use KubeVela

* If you're using KubeVela, add your organisation to the adopters list ([issue #1662](https://github.com/kubevela/kubevela/issues/1662)). It's the easiest way to help.
* Write a post for the [KubeVela blog](https://kubevela.io/blog) about your use case.
* Add an example to [KubeVela Samples](https://github.com/kubevela/samples).

## Report bugs

Before submitting a new issue, try to make sure someone hasn't already reported the problem.
Look through the [existing issues](https://github.com/kubevela/kubevela/issues) for similar issues.

Report a bug by submitting a [bug report](https://github.com/kubevela/kubevela/issues/new?assignees=&labels=type%2Fbug&template=bug_report.yml&title=).
Make sure that you provide as much information as possible on how to reproduce the bug.

Follow the issue template and add additional information that will help us replicate the problem.

### Security issues

If you believe you've found a security vulnerability, please read our [security policy](https://github.com/kubevela/kubevela/blob/master/SECURITY.md) for more details.

## Suggest features and enhancements

If you have an idea for something that doesn't exist yet, submit a [feature request](https://github.com/kubevela/kubevela/issues/new?assignees=&labels=type%2Ffeature&template=feature_request.yml&title=%5BFeature%5D).
If you want to improve something that's already there, submit an [enhancement request](https://github.com/kubevela/kubevela/issues/new?assignees=&labels=type%2Fenhancement&template=enhancement_request.yml&title=%5BEnhancement%5D).

## Triage issues

If you don't have the knowledge or time to code, consider helping with _issue triage_. The community will thank you for saving them time by spending some of yours.

Read more about the ways you can [Triage issues](https://github.com/kubevela/community/blob/main/ISSUE_TRIAGE.md).

## Answer questions

If you have a question and you can't find the answer in the [documentation](https://kubevela.io/docs/),
the next step is to ask it on the [github discussion](https://github.com/kubevela/kubevela/discussions).

It's important to us to help these users, and we'd love your help. You can help other KubeVela users by answering [their questions](https://github.com/kubevela/kubevela/discussions).

## Contribute to the docs

The docs live in [kubevela/kubevela.github.io](https://github.com/kubevela/kubevela.github.io). To change a page:

1. Fork `kubevela/kubevela.github.io` and clone your fork.
2. Find the page. `docs/` is the next, unreleased version; `versioned_docs/version-vX.Y/` holds the released ones. If a page is wrong in a release, fix it in `docs/` and in each `versioned_docs/` copy it is wrong in.
3. Preview your change:

   ```shell
   yarn install
   yarn start
   ```

   This opens the site locally and reloads as you edit.
4. Commit with `git commit -s`. Every commit needs a `Signed-off-by` line ([DCO](./code-contribute.md#sign-your-commits-dco)).
5. Open a pull request against `main`.

Some pages are generated from the KubeVela code, so change them in [kubevela/kubevela](https://github.com/kubevela/kubevela) instead, then regenerate:

* the CLI reference under `cli/`;
* the built-in component, trait, policy and workflow step references (see [Update Reference Docs](./cli-ref-doc.md));
* `reference/vela-mcp-tools.md`, from `hack/docgen/mcp`.

A generated page says so at its top or bottom.

For more ways to contribute, check out the [Open Source Guides](https://opensource.guide/how-to-contribute/).
