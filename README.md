# KubeVela Docs & Website

This repo contains the source code of [Kubevela website](http://kubevela.io/) and all of the docs for KubeVela.
It's built by [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

Welcome to join us and you are more than appreciated to contribute!

## Contributing to KubeVela EN Docs

First, we have the source documentation of [Kubevela website](http://kubevela.io/) and it's written in English. Follow [Localization README](https://github.com/kubevela/kubevela.io#localization-readme) for contributing to other languages.
Any files modifid here will trigger the `check-docs` Github action to run and validate the docs could be build successfully into the website.
Any changes on these files(`docs/en/*`, `docs/en/resource/*`, `sidebars.js`) will be submitted to the corresponding locations of the repo 
[kubevela.io](https://github.com/kubevela/kubevela.io). The Github-Action there will parse the document and publish it to the Kubevela Website automatically.

Please follow our guides below to learn how to write the docs in the right way.

## Add or Update Docs

When you add or modify the docs, these three files(`docs/en/`, `docs/en/resource/` and `sidebars.js`) should be taken into consideration.

1. `docs/en/`, the main English documentation files are mainly located in this folder. All markdown files need to follow the format,
   that the title at the beginning should be in the following format:

    ```markdown
    ---
    title: Title Name
    ---
   
    ```

   When you want to add a link refer to any `.md` files inside the docs(`docs/en`), you need to use relative path and remove the `.md` suffix.
   For example, the `en/helm/component.md` has a link refer to `en/platform-engineers/definition-and-templates.md`. Then the format should like:

    ```markdown
   [the definition and template concepts](../platform-engineers/definition-and-templates)
    ```

2. `docs/en/resource/`, image files are located in this folder. When you want to use link any image in documentation, 
   you should put the image resources here and use a relative path like below:

   ```markdown
    ![alt](./resources/concepts.png)
   ```

3. `sidebars.js`, this file contain the navigation information of the KubeVela website.
   Please read [the official docs of docusaurus](https://docusaurus.io/docs/sidebar) to learn how to write `sidebar.js`.

   ```js
      {
         type: 'category',
         label: 'Capability References',
         items: [
           // Note!: here must be add the path under "docs/en" 
           'developers/references/README',
           'developers/references/workload-types/webservice',
           'developers/references/workload-types/task',
           ...
         ],
       },
   ```

After you finished modify the docs, please try to [have a preview of the changes](#Website-Preview).


## Localization README

| Language                |
| ----------------------- |
| [Chinese](README-zh.md) |


# Website Preview

Please make sure you have [yarn installed](https://www.geeksforgeeks.org/how-to-install-yarn-in-macos-ubuntu-windows/) in your OS environment.

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

## Versions for new release

All docs of new features should be updated in the latest docs, we will create a new version of docs along with the code release.

### Build New Version

```
yarn docusaurus docs:version v1.x
```

### Update Docs for version

```
make update-version version=v1.x
```

## Send your pull request

After all changes checked well, please [creating a pull request](https://help.github.com/en/articles/creating-a-pull-request) with [DCO](https://github.com/apps/dco).