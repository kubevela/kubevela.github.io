---
title: netlify
---

The netlify addon adds a `netlify` component type that deploys a static website to [Netlify](https://www.netlify.com/). The component runs a Kubernetes Job that clones a git repository and publishes it with the Netlify CLI.

## Install

```bash
vela addon enable netlify
```

To remove it:

```bash
vela addon disable netlify
```

## Parameters

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `token` | Your Netlify personal access token, base64-encoded. | string | false | `your-own-token-after-base64` |
| `sitename` | The site name on app.netlify.com. Set it: the component doesn't render without it. | string | true | |
| `gitrepo` | Address of the git repository holding the site. | string | false | `https://github.com/oeular/oeular.github.io.git` |
| `reponame` | Directory to clone the repository into. | string | false | `oeular.github.io` |
| `backofflimit` | `backoffLimit` of the deploy Job. | int | false | `5` |
| `completions` | `completions` and `parallelism` of the deploy Job. | int | false | `1` |
| `restartPolicy` | Restart policy of the deploy Job's pod. | string | false | `OnFailure` |

:::note
The definition also declares `sitname`, but the template never reads it. Set `sitename`.
:::

## Deploy a site

1. Create a personal access token at app.netlify.com > User settings > Applications, then base64-encode it:

   ```bash
   echo -n '<token>' | base64
   ```

2. Save the following as `netlify-app.yaml`. Name the component `netlify`: the deploy Job reads the token from a Secret called `netlify`, and the component writes the token to a Secret named after itself.

   ```yaml
   apiVersion: core.oam.dev/v1beta1
   kind: Application
   metadata:
     name: netlify-app
     namespace: default
   spec:
     components:
       - name: netlify
         type: netlify
         properties:
           sitename: <site name>
           # optional: the defaults deploy a demo site from github.com/oeular/oeular.github.io
           gitrepo: <git repository address>
           reponame: <repository name>
           token: <base64-encoded token>
   ```

3. Deploy it:

   ```bash
   vela up -f netlify-app.yaml
   ```

4. Find the site's address in the Job's logs:

   ```bash
   vela logs netlify-app -n default | grep "Website URL"
   ```

   The line ends with the address, for example `Website URL:       https://deploy-from-vela.netlify.app`.

## More

- [Netlify CLI documentation](https://docs.netlify.com/)
