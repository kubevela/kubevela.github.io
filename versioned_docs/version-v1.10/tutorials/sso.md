---
title:  SSO Login
---

VelaUX has two ways to sign in: local login, with a username and password stored in VelaUX, and single sign-on (SSO) through [Dex](https://dexidp.io/). Dex connects to many identity providers, such as GitHub, GitLab, LDAP, Google, OIDC and SAML.

A new installation uses local login. A platform administrator switches it to SSO in **Admin Dashboard > Settings**. This guide sets up SSO with a GitHub connector and an LDAP connector.

## How SSO users map to VelaUX users

VelaUX matches an SSO login to a local user by email, and the login gets that user's roles, including admin. Use only connectors that verify email addresses, and set the admin's email to an address you control.

A login with an email that matches no local user creates a new user. That user starts with the default projects and roles you set in **Settings** (see [Switch to SSO](#switch-to-sso)), and nothing else.

## Enable the Dex addon

Enable the `dex` addon from the addon list:

![alt](https://kubevela.io/images/1.3/dex-addon.png)

That is all VelaUX needs: it reads the Dex configuration from the `dex-config` Secret the addon uses, and writes your connectors into it.

## Configure a Dex connector

You need at least one connector before you can switch to SSO. Connectors are configs of the **Dex Connector** template, under **Admin Dashboard > Global Configs**.

### GitHub connector

1. In GitHub's **Developer settings**, create an OAuth App. Set its **Authorization callback URL** to `<VelaUX address>/dex/callback`.

   VelaUX needs an address your users' browsers can reach, and that address is the callback URL you register with GitHub. GitHub sends the browser back to it after login, so it does not have to be reachable from the internet, only from your users' machines.

2. In **Admin Dashboard > Global Configs**, create a **Dex Connector** config of type `GitHub`. Set the **Client ID** and **Client Secret** from the OAuth App, and set the **Redirect URI** to the same `<VelaUX address>/dex/callback`.

![alt](https://kubevela.io/images/1.3/intergration.png)

### LDAP connector

Make sure your LDAP server is reachable from the cluster VelaUX runs in.

1. Create a **Dex Connector** config of type `LDAP`. Set **Host** to the address of the LDAP server, and set **BaseDN**.

   ![alt](https://kubevela.io/images/1.3/ldap1.png)

2. If your LDAP server does not allow anonymous search, open **Advanced Parameters** and set **BindDN** and **BindPW**. The connector searches for users with these credentials.

   ![alt](https://kubevela.io/images/1.3/ldap2.png)

For other connector types, see [Dex Connectors Configuration](../how-to/dashboard/config/dex-connectors.md).

## Switch to SSO

1. In **Admin Dashboard > Users**, set the email of each administrator to an address they own in the identity provider. Their SSO login then signs them in as that admin.
2. In **Admin Dashboard > Settings**, set **User login mode** to **SSO by dex** and set **VelaUX address** to the address your users open VelaUX at.
3. Click **Click me to open the dex login page** and check that the Dex page loads and lists your connectors. Fix the connectors before you go on if it does not.
4. Optionally, set the default projects and project roles for users who sign in through SSO for the first time.
5. Submit.

![alt](https://kubevela.io/images/1.5/platform-setting.jpg)

### Locked out?

After the switch, an administrator can still sign in through Dex with their email and VelaUX password: VelaUX gives Dex every admin user as a password login. Sign in that way and set the login method back to local in **Settings**. Before switching, keep a session open in another tab; it stays valid for an hour, long enough to switch back.

## Sign in with SSO

Sign out and reload the page. VelaUX sends you to the Dex login page:

![alt](https://kubevela.io/images/1.3/dex-login.png)

Choose GitHub or LDAP and sign in:

![alt](https://kubevela.io/images/1.3/dex-grant-access.png)

If your email matches a local user, you are signed in as that user, with its roles. Otherwise VelaUX creates a new user with the defaults from **Settings**.
