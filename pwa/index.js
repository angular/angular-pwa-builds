"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const schematics_1 = require("@angular-devkit/schematics");
const utility_1 = require("@schematics/angular/utility");
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const promises_1 = require("node:stream/promises");
function updateIndexFile(path) {
    return async (host) => {
        const originalContent = host.readText(path);
        const { RewritingStream } = await loadEsmModule('parse5-html-rewriting-stream');
        const rewriter = new RewritingStream();
        let needsNoScript = true;
        rewriter.on('startTag', (startTag) => {
            if (startTag.tagName === 'noscript') {
                needsNoScript = false;
            }
            rewriter.emitStartTag(startTag);
        });
        rewriter.on('endTag', (endTag) => {
            if (endTag.tagName === 'head') {
                rewriter.emitRaw('  <link rel="manifest" href="manifest.webmanifest">\n');
            }
            else if (endTag.tagName === 'body' && needsNoScript) {
                rewriter.emitRaw('  <noscript>Please enable JavaScript to continue using this application.</noscript>\n');
            }
            rewriter.emitEndTag(endTag);
        });
        return (0, promises_1.pipeline)(node_stream_1.Readable.from(originalContent), rewriter, async function (source) {
            const chunks = [];
            for await (const chunk of source) {
                chunks.push(Buffer.from(chunk));
            }
            host.overwrite(path, Buffer.concat(chunks));
        });
    };
}
function default_1(options) {
    return async (host) => {
        if (!options.title) {
            options.title = options.project;
        }
        const workspace = await (0, utility_1.readWorkspace)(host);
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option "project" is required.');
        }
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project is not defined in this workspace.`);
        }
        if (project.extensions['projectType'] !== 'application') {
            throw new schematics_1.SchematicsException(`PWA requires a project type of "application".`);
        }
        // Find all the relevant targets for the project
        if (project.targets.size === 0) {
            throw new schematics_1.SchematicsException(`Targets are not defined for this project.`);
        }
        const buildTargets = [];
        const testTargets = [];
        for (const target of project.targets.values()) {
            if (target.builder === '@angular-devkit/build-angular:browser' ||
                target.builder === '@angular-devkit/build-angular:application' ||
                target.builder === '@angular/build:application') {
                buildTargets.push(target);
            }
            else if (target.builder === '@angular-devkit/build-angular:karma' ||
                target.builder === '@angular/build:karma') {
                testTargets.push(target);
            }
        }
        // Find all index.html files in build targets
        const indexFiles = new Set();
        let checkForDefaultIndex = false;
        for (const target of buildTargets) {
            if (typeof target.options?.index === 'string') {
                indexFiles.add(target.options.index);
            }
            else if (target.options?.index === undefined) {
                checkForDefaultIndex = true;
            }
            if (!target.configurations) {
                continue;
            }
            for (const options of Object.values(target.configurations)) {
                if (typeof options?.index === 'string') {
                    indexFiles.add(options.index);
                }
                else if (options?.index === undefined) {
                    checkForDefaultIndex = true;
                }
            }
        }
        // Setup sources for the assets files to add to the project
        const sourcePath = project.sourceRoot ?? node_path_1.posix.join(project.root, 'src');
        // Check for a default index file if a configuration path allows for a default usage
        if (checkForDefaultIndex) {
            const defaultIndexFile = node_path_1.posix.join(sourcePath, 'index.html');
            if (host.exists(defaultIndexFile)) {
                indexFiles.add(defaultIndexFile);
            }
        }
        // Setup service worker schematic options
        const { title, ...swOptions } = options;
        await (0, utility_1.writeWorkspace)(host, workspace);
        let assetsDir = node_path_1.posix.join(sourcePath, 'assets');
        let iconsPath;
        if (host.exists(assetsDir)) {
            // Add manifest to asset configuration
            const assetEntry = node_path_1.posix.join(project.sourceRoot ?? node_path_1.posix.join(project.root, 'src'), 'manifest.webmanifest');
            for (const target of [...buildTargets, ...testTargets]) {
                if (target.options) {
                    if (Array.isArray(target.options.assets)) {
                        target.options.assets.push(assetEntry);
                    }
                    else {
                        target.options.assets = [assetEntry];
                    }
                }
                else {
                    target.options = { assets: [assetEntry] };
                }
            }
            iconsPath = 'assets';
        }
        else {
            assetsDir = node_path_1.posix.join(project.root, 'public');
            iconsPath = 'icons';
        }
        return (0, schematics_1.chain)([
            (0, schematics_1.externalSchematic)('@schematics/angular', 'service-worker', swOptions),
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files/assets'), [(0, schematics_1.template)({ ...options, iconsPath }), (0, schematics_1.move)(assetsDir)])),
            ...[...indexFiles].map((path) => updateIndexFile(path)),
        ]);
    };
}
/**
 * This uses a dynamic import to load a module which may be ESM.
 * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
 * will currently, unconditionally downlevel dynamic import into a require call.
 * require calls cannot load ESM code and will result in a runtime error. To workaround
 * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
 * Once TypeScript provides support for keeping the dynamic import this workaround can
 * be dropped.
 *
 * @param modulePath The path of the module to load.
 * @returns A Promise that resolves to the dynamically imported module.
 */
function loadEsmModule(modulePath) {
    return new Function('modulePath', `return import(modulePath);`)(modulePath);
}
