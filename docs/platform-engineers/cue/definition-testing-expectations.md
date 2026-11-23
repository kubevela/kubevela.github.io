---
title: Expectations and Errors
---

How a case states what it expects: the matching rules, the error categories, and the attributes
that label, park or mark a case.

## Expectations

An expectation passes when it subsumes the result: fields it names must be present and match, and
fields it does not name are ignored.

| Form | Meaning |
| --- | --- |
| `f: v` | `f` is present and matches `v`, which may be a CUE constraint such as `=~"^nginx"`, `>2` or `!=3`. |
| `f?: _|_` | `f` is absent. |
| `[a, b]` | A list of exactly these elements, in order. |
| `[a, b, ...]` | A list that starts with these elements. |
| `f: {...} @exact()` | `f` has no fields beyond those given. |
| `f: ... @not()` | Passes unless `f` is present and matches. |
| `f: [...] @contains()` | Each element given matches a different element of `f`, in any order. |
| `f: [...] @contains() @not()` | None of the elements given is present. |

CUE's `close()` has no special meaning in an expectation. Attributes go on a field, not on a list
element. An `@exact()`, `@not()` or `@contains()` on a hidden field that the expectation only references
is a load error.

## Errors

`expect.error` is either a string constraint matched against the whole message, such as
`error: =~"replicas"`, or a struct of messages by category:

| Category | Holds |
| --- | --- |
| `message` | The whole message. |
| `user` | What the definition raised through `errs`. |
| `parameter` | Parameter validation errors. |
| `template` | The template's other errors, and any other render failure. |
| `status` | Errors evaluating health, message or details. |
| `schema` | How a source's output does not fit its schema. |

Each category is a list of messages; one error can produce several, so `[=~"tier", ...]` expects at
least one. A category is present only when it has messages, so `template?: _|_` asserts the template was
fine. Any other field is a load error. A case that expects an error expects nothing else.

## Attributes

| Attribute | Placed | Effect |
| --- | --- | --- |
| `@label(a, b:c)` | after a case, inside one, inside a struct it is built from, or at the top of the file | Labels for `--label-filter`. Every case is also labelled with its kind (`component`, `trait`, `policy`, `application-policy`, `addon`, `workflow-step`, `source`), what it does (`render`, `status`, `exec`), and `upgrade` when marked `@upgrade`. |
| `@pending(reason)` | as `@label` | The case loads but does not run, and is counted as pending. |
| `@upgrade(reason="...")` | as `@label` | A known dependency on KubeVela's CUE upgrader. A case that fails as written is retried with the controller's default rewrites, plus any named, as in `@upgrade(generic-default-guard, reason="...")`, and counted as upgraded. It fails once it passes as written, until the marker is removed. |
| `@before()`, `@beforeEach()`, `@afterEach()`, `@after()` | on a top-level field, hidden or not | Makes the field a [hook](./definition-testing-mocks-hooks.md#hooks). |
