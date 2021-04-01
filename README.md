# KubeVela Website

This repo contains the source code of [Kubevela website](http://kubevela.io/), and most of the docs are generated from [KubeVela](https://github.com/oam-dev/kubevela/tree/master/docs).
It's built by [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

> ⚠️ Note! The `sidebar.js` and the files in `/docs` are synchronized from the repo [kubevela](https://github.com/oam-dev/kubevela/tree/master/docs). 
> Please submit your Pull Requst [there](https://github.com/oam-dev/kubevela) if you want to modify these two kinds of files.
> The code will automatically sync here after merge.

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
