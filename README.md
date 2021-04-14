
# Snapshot build of @angular/pwa

This repository is a snapshot of a commit on the original repository. The original code used to
generate this is located at http://github.com/angular/angular-cli.

We do not accept PRs or Issues opened on this repository. You should not use this over a tested and
released version of this package.

To test this snapshot in your own project, use

```bash
npm install git+https://github.com/angular/angular-pwa-builds.git
```

----
# `@angular/pwa`

This is a [schematic](https://angular.io/guide/schematics) for adding
[Progress Web App](https://web.dev/progressive-web-apps/) support to an Angular app. Run the
schematic with the [Angular CLI](https://angular.io/cli):

```shell
ng add @angular/pwa
```

This makes a few changes to your project:

1. Adds [`@angular/service-worker`](https://npmjs.com/@angular/service-worker) as a dependency.
1. Enables service worker builds in the Angular CLI.
1. Imports and registers the service worker in the app module.
1. Adds a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest).
1. Updates the `index.html` file to link to the manifest and set theme colors.
1. Adds required icons for the manifest.
1. Creates a config file `ngsw-config.json`, specifying caching behaviors and other settings.

See [Getting started with service workers](https://angular.io/guide/service-worker-getting-started)
for more information.
