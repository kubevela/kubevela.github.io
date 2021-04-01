# KubeVela Website

This repo contains the source code of [Kubevela website](http://kubevela.io/). 
It's built by [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

> ⚠️ Note! The `sidebar.js` and the files in `/docs` are synchronized from the repo [kubevela](https://github.com/oam-dev/kubevela). 
> so if you want fix `sidebar.js` or `md` files in `/docs` to update the official document, please submit your code to 
> [kubevela](https://github.com/oam-dev/kubevela). The code to update other files is still submitted in this repo.

## Installation

```console
yarn install
```

## Local Development

```console
yarn start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

```console
GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
