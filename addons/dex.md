---
title: dex
---

This addon provides Dex login for VelaUX.

[Dex](https://dexidp.io/docs/) is an identity service that uses [OpenID Connect](https://openid.net/connect/) to drive authentication for other apps. It hands the login itself to an identity provider through a [connector](https://dexidp.io/docs/connectors/): GitHub, GitLab, Google, LDAP, SAML, or any OIDC or OAuth provider. VelaUX talks only to Dex, and the addon's `dex-connector` config template covers those seven connector types.

The addon installs the Dex Helm chart (`dex` 0.15.3) in `vela-system`, and adds the `dex-connector` config template, with a form for it in VelaUX. It depends on the `velaux` and `fluxcd` addons, and enables them if they are not enabled already.

## Install

```shell
vela addon enable dex
```

## Set up single sign-on

Enabling the addon is the first step of single sign-on for VelaUX. Dex has nothing to log in with until you add a connector, and VelaUX keeps using local login until you switch it over.

1. **Add a connector.** Create a `dex-connector` config in `vela-system`, either in VelaUX's config pages or with the CLI. For a GitHub OAuth app:

   ```shell
   vela config create github-sso --template=dex-connector \
     type=github \
     github.clientID=<client ID> \
     github.clientSecret=<client secret> \
     github.redirectURI=https://<VelaUX address>/dex/callback
   ```

   The `type` picks the connector: `github`, `gitlab`, `google`, `ldap`, `oidc`, `saml` or `oauth`, each with its settings under the field of the same name.

2. **Give the admin user an email.** A user who logs in through Dex is matched to the VelaUX user with the same email, so set the admin's email to the one they will log in with. Otherwise nobody who logs in through Dex has platform admin rights.

3. **Turn on Dex login.** In VelaUX, open the platform **Settings** page (`/settings`), set **User login mode** to **SSO by dex**, set **VelaUX address** to the address in `github.redirectURI` without `/dex/callback`, and save. VelaUX refuses the change while there is no connector. Before you save, use **Click me to open the dex login page** to check the connector works.

See [Single Sign-On](/docs/tutorials/sso) for the walkthrough, with GitHub and LDAP examples, and [Other connectors](/docs/tutorials/sso#other-connectors) for the other connector types.

## Uninstall

Switch **User login mode** back to **Local** first, then:

```shell
vela addon disable dex
```
