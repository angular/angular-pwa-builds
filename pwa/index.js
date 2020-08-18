"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const stream_1 = require("stream");
const RewritingStream = require('parse5-html-rewriting-stream');
function updateIndexFile(path) {
    return (host) => {
        const buffer = host.read(path);
        if (buffer === null) {
            throw new schematics_1.SchematicsException(`Could not read index file: ${path}`);
        }
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
                rewriter.emitRaw('  <meta name="theme-color" content="#1976d2">\n');
            }
            else if (endTag.tagName === 'body' && needsNoScript) {
                rewriter.emitRaw('  <noscript>Please enable JavaScript to continue using this application.</noscript>\n');
            }
            rewriter.emitEndTag(endTag);
        });
        return new Promise(resolve => {
            const input = new stream_1.Readable({
                encoding: 'utf8',
                read() {
                    this.push(buffer);
                    this.push(null);
                },
            });
            const chunks = [];
            const output = new stream_1.Writable({
                write(chunk, encoding, callback) {
                    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk);
                    callback();
                },
                final(callback) {
                    const full = Buffer.concat(chunks);
                    host.overwrite(path, full.toString());
                    callback();
                    resolve();
                },
            });
            input.pipe(rewriter).pipe(output);
        });
    };
}
function default_1(options) {
    return async (host) => {
        if (!options.title) {
            options.title = options.project;
        }
        // Keep Bazel from failing due to deep import
        const { getWorkspace, updateWorkspace } = require('@schematics/angular/utility/workspace');
        const workspace = await getWorkspace(host);
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
            if (target.builder === '@angular-devkit/build-angular:browser') {
                buildTargets.push(target);
            }
            else if (target.builder === '@angular-devkit/build-angular:karma') {
                testTargets.push(target);
            }
        }
        // Add manifest to asset configuration
        const assetEntry = core_1.join(core_1.normalize(project.root), 'src', 'manifest.webmanifest');
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
        // Find all index.html files in build targets
        const indexFiles = new Set();
        for (const target of buildTargets) {
            if (target.options && typeof target.options.index === 'string') {
                indexFiles.add(target.options.index);
            }
            if (!target.configurations) {
                continue;
            }
            for (const configName in target.configurations) {
                const configuration = target.configurations[configName];
                if (configuration && typeof configuration.index === 'string') {
                    indexFiles.add(configuration.index);
                }
            }
        }
        // Setup sources for the assets files to add to the project
        const sourcePath = core_1.join(core_1.normalize(project.root), 'src');
        const assetsPath = core_1.join(sourcePath, 'assets');
        const rootTemplateSource = schematics_1.apply(schematics_1.url('./files/root'), [
            schematics_1.template({ ...options }),
            schematics_1.move(core_1.getSystemPath(sourcePath)),
        ]);
        const assetsTemplateSource = schematics_1.apply(schematics_1.url('./files/assets'), [
            schematics_1.template({ ...options }),
            schematics_1.move(core_1.getSystemPath(assetsPath)),
        ]);
        // Setup service worker schematic options
        const swOptions = { ...options };
        delete swOptions.title;
        // Chain the rules and return
        return schematics_1.chain([
            updateWorkspace(workspace),
            schematics_1.externalSchematic('@schematics/angular', 'service-worker', swOptions),
            schematics_1.mergeWith(rootTemplateSource),
            schematics_1.mergeWith(assetsTemplateSource),
            ...[...indexFiles].map(path => updateIndexFile(path)),
        ]);
    };
}
exports.default = default_1;
