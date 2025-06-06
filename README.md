
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

This is a [schematic](https://angular.dev/tools/cli/schematics) for adding
[Progressive Web App](https://web.dev/progressive-web-apps/) support to an Angular project. Run the
schematic with the [Angular CLI](https://angular.dev/tools/cli):

```shell
ng add @angular/pwa --project <project-name>
```

Executing the command mentioned above will perform the following actions:

1. Adds [`@angular/service-worker`](https://npmjs.com/@angular/service-worker) as a dependency to your project.
1. Enables service worker builds in the Angular CLI.
1. Imports and registers the service worker in the application module.
1. Updates the `index.html` file to inlclude a link to add the [manifest.webmanifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) file.
1. Installs icon files to support the installed Progressive Web App (PWA).
1. Creates the service worker configuration file called `ngsw-config.json`, specifying caching behaviors and other settings.

See [Getting started with service workers](https://angular.dev/ecosystem/service-workers/getting-started)
for more information.
