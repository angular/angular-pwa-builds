"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const utility_1 = require("@schematics/angular/utility");
const path_1 = require("path");
const stream_1 = require("stream");
function updateIndexFile(path) {
    return async (host) => {
        const buffer = host.read(path);
        if (buffer === null) {
            throw new schematics_1.SchematicsException(`Could not read index file: ${path}`);
        }
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
                rewriter.emitRaw('  <meta name="theme-color" content="#1976d2">\n');
            }
            else if (endTag.tagName === 'body' && needsNoScript) {
                rewriter.emitRaw('  <noscript>Please enable JavaScript to continue using this application.</noscript>\n');
            }
            rewriter.emitEndTag(endTag);
        });
        return new Promise((resolve) => {
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
            if (target.builder === '@angular-devkit/build-angular:browser') {
                buildTargets.push(target);
            }
            else if (target.builder === '@angular-devkit/build-angular:karma') {
                testTargets.push(target);
            }
        }
        // Add manifest to asset configuration
        const assetEntry = path_1.posix.join(project.sourceRoot ?? path_1.posix.join(project.root, 'src'), 'manifest.webmanifest');
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
            if (typeof target.options?.index === 'string') {
                indexFiles.add(target.options.index);
            }
            if (!target.configurations) {
                continue;
            }
            for (const options of Object.values(target.configurations)) {
                if (typeof options?.index === 'string') {
                    indexFiles.add(options.index);
                }
            }
        }
        // Setup sources for the assets files to add to the project
        const sourcePath = project.sourceRoot ?? path_1.posix.join(project.root, 'src');
        // Setup service worker schematic options
        const { title, ...swOptions } = options;
        await (0, utility_1.writeWorkspace)(host, workspace);
        return (0, schematics_1.chain)([
            (0, schematics_1.externalSchematic)('@schematics/angular', 'service-worker', swOptions),
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files/root'), [(0, schematics_1.template)({ ...options }), (0, schematics_1.move)(sourcePath)])),
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files/assets'), [
                (0, schematics_1.template)({ ...options }),
                (0, schematics_1.move)(path_1.posix.join(sourcePath, 'assets')),
            ])),
            ...[...indexFiles].map((path) => updateIndexFile(path)),
        ]);
    };
}
exports.default = default_1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwyREFXb0M7QUFDcEMseURBQTRFO0FBQzVFLCtCQUE2QjtBQUM3QixtQ0FBNEM7QUFHNUMsU0FBUyxlQUFlLENBQUMsSUFBWTtJQUNuQyxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsRUFBRTtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtZQUNuQixNQUFNLElBQUksZ0NBQW1CLENBQUMsOEJBQThCLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckU7UUFFRCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxhQUFhLENBQzdDLDhCQUE4QixDQUMvQixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN2QyxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDekIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNuQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2FBQ3ZCO1lBRUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO2dCQUMxRSxRQUFRLENBQUMs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QUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN2QyxDQUFDLENBQ0g7WUFDRCxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBM0ZELDRCQTJGQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBUyxhQUFhLENBQUksVUFBd0I7SUFDaEQsT0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEVBQUUsNEJBQTRCLENBQUMsQ0FBQyxVQUFVLENBQWUsQ0FBQztBQUM1RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBjaGFpbixcbiAgZXh0ZXJuYWxTY2hlbWF0aWMsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgdGVtcGxhdGUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgcmVhZFdvcmtzcGFjZSwgd3JpdGVXb3Jrc3BhY2UgfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHknO1xuaW1wb3J0IHsgcG9zaXggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJlYWRhYmxlLCBXcml0YWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgUHdhT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuZnVuY3Rpb24gdXBkYXRlSW5kZXhGaWxlKHBhdGg6IHN0cmluZyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSBob3N0LnJlYWQocGF0aCk7XG4gICAgaWYgKGJ1ZmZlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCByZWFkIGluZGV4IGZpbGU6ICR7cGF0aH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IFJld3JpdGluZ1N0cmVhbSB9ID0gYXdhaXQgbG9hZEVzbU1vZHVsZTx0eXBlb2YgaW1wb3J0KCdwYXJzZTUtaHRtbC1yZXdyaXRpbmctc3RyZWFtJyk+KFxuICAgICAgJ3BhcnNlNS1odG1sLXJld3JpdGluZy1zdHJlYW0nLFxuICAgICk7XG5cbiAgICBjb25zdCByZXdyaXRlciA9IG5ldyBSZXdyaXRpbmdTdHJlYW0oKTtcbiAgICBsZXQgbmVlZHNOb1NjcmlwdCA9IHRydWU7XG4gICAgcmV3cml0ZXIub24oJ3N0YXJ0VGFnJywgKHN0YXJ0VGFnKSA9PiB7XG4gICAgICBpZiAoc3RhcnRUYWcudGFnTmFtZSA9PT0gJ25vc2NyaXB0Jykge1xuICAgICAgICBuZWVkc05vU2NyaXB0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyhzdGFydFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXdyaXRlci5vbignZW5kVGFnJywgKGVuZFRhZykgPT4ge1xuICAgICAgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnaGVhZCcpIHtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdygnICA8bGluayByZWw9XCJtYW5pZmVzdFwiIGhyZWY9XCJtYW5pZmVzdC53ZWJtYW5pZmVzdFwiPlxcbicpO1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KCcgIDxtZXRhIG5hbWU9XCJ0aGVtZS1jb2xvclwiIGNvbnRlbnQ9XCIjMTk3NmQyXCI+XFxuJyk7XG4gICAgICB9IGVsc2UgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnYm9keScgJiYgbmVlZHNOb1NjcmlwdCkge1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KFxuICAgICAgICAgICcgIDxub3NjcmlwdD5QbGVhc2UgZW5hYmxlIEphdmFTY3JpcHQgdG8gY29udGludWUgdXNpbmcgdGhpcyBhcHBsaWNhdGlvbi48L25vc2NyaXB0PlxcbicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRFbmRUYWcoZW5kVGFnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSBuZXcgUmVhZGFibGUoe1xuICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICByZWFkKCk6IHZvaWQge1xuICAgICAgICAgIHRoaXMucHVzaChidWZmZXIpO1xuICAgICAgICAgIHRoaXMucHVzaChudWxsKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaHVua3M6IEFycmF5PEJ1ZmZlcj4gPSBbXTtcbiAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBXcml0YWJsZSh7XG4gICAgICAgIHdyaXRlKGNodW5rOiBzdHJpbmcgfCBCdWZmZXIsIGVuY29kaW5nOiBCdWZmZXJFbmNvZGluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgICAgY2h1bmtzLnB1c2godHlwZW9mIGNodW5rID09PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNodW5rLCBlbmNvZGluZykgOiBjaHVuayk7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluYWwoY2FsbGJhY2s6IChlcnJvcj86IEVycm9yKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgICAgY29uc3QgZnVsbCA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKTtcbiAgICAgICAgICBob3N0Lm92ZXJ3cml0ZShwYXRoLCBmdWxsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGlucHV0LnBpcGUocmV3cml0ZXIpLnBpcGUob3V0cHV0KTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0KSA9PiB7XG4gICAgaWYgKCFvcHRpb25zLnRpdGxlKSB7XG4gICAgICBvcHRpb25zLnRpdGxlID0gb3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IHJlYWRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgaXMgbm90IGRlZmluZWQgaW4gdGhpcyB3b3Jrc3BhY2UuYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2plY3QuZXh0ZW5zaW9uc1sncHJvamVjdFR5cGUnXSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFBXQSByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIuYCk7XG4gICAgfVxuXG4gICAgLy8gRmluZCBhbGwgdGhlIHJlbGV2YW50IHRhcmdldHMgZm9yIHRoZSBwcm9qZWN0XG4gICAgaWYgKHByb2plY3QudGFyZ2V0cy5zaXplID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgVGFyZ2V0cyBhcmUgbm90IGRlZmluZWQgZm9yIHRoaXMgcHJvamVjdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZFRhcmdldHMgPSBbXTtcbiAgICBjb25zdCB0ZXN0VGFyZ2V0cyA9IFtdO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cy52YWx1ZXMoKSkge1xuICAgICAgaWYgKHRhcmdldC5idWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6YnJvd3NlcicpIHtcbiAgICAgICAgYnVpbGRUYXJnZXRzLnB1c2godGFyZ2V0KTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjprYXJtYScpIHtcbiAgICAgICAgdGVzdFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBtYW5pZmVzdCB0byBhc3NldCBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgYXNzZXRFbnRyeSA9IHBvc2l4LmpvaW4oXG4gICAgICBwcm9qZWN0LnNvdXJjZVJvb3QgPz8gcG9zaXguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKSxcbiAgICAgICdtYW5pZmVzdC53ZWJtYW5pZmVzdCcsXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBbLi4uYnVpbGRUYXJnZXRzLCAuLi50ZXN0VGFyZ2V0c10pIHtcbiAgICAgIGlmICh0YXJnZXQub3B0aW9ucykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQub3B0aW9ucy5hc3NldHMpKSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzLnB1c2goYXNzZXRFbnRyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzID0gW2Fzc2V0RW50cnldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXQub3B0aW9ucyA9IHsgYXNzZXRzOiBbYXNzZXRFbnRyeV0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCBpbmRleC5odG1sIGZpbGVzIGluIGJ1aWxkIHRhcmdldHNcbiAgICBjb25zdCBpbmRleEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgYnVpbGRUYXJnZXRzKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldC5vcHRpb25zPy5pbmRleCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW5kZXhGaWxlcy5hZGQodGFyZ2V0Lm9wdGlvbnMuaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRhcmdldC5jb25maWd1cmF0aW9ucykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBvcHRpb25zIG9mIE9iamVjdC52YWx1ZXModGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnM/LmluZGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGluZGV4RmlsZXMuYWRkKG9wdGlvbnMuaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0dXAgc291cmNlcyBmb3IgdGhlIGFzc2V0cyBmaWxlcyB0byBhZGQgdG8gdGhlIHByb2plY3RcbiAgICBjb25zdCBzb3VyY2VQYXRoID0gcHJvamVjdC5zb3VyY2VSb290ID8/IHBvc2l4LmpvaW4ocHJvamVjdC5yb290LCAnc3JjJyk7XG5cbiAgICAvLyBTZXR1cCBzZXJ2aWNlIHdvcmtlciBzY2hlbWF0aWMgb3B0aW9uc1xuICAgIGNvbnN0IHsgdGl0bGUsIC4uLnN3T3B0aW9ucyB9ID0gb3B0aW9ucztcblxuICAgIGF3YWl0IHdyaXRlV29ya3NwYWNlKGhvc3QsIHdvcmtzcGFjZSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgZXh0ZXJuYWxTY2hlbWF0aWMoJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLCAnc2VydmljZS13b3JrZXInLCBzd09wdGlvbnMpLFxuICAgICAgbWVyZ2VXaXRoKGFwcGx5KHVybCgnLi9maWxlcy9yb290JyksIFt0ZW1wbGF0ZSh7IC4uLm9wdGlvbnMgfSksIG1vdmUoc291cmNlUGF0aCldKSksXG4gICAgICBtZXJnZVdpdGgoXG4gICAgICAgIGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW1xuICAgICAgICAgIHRlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSxcbiAgICAgICAgICBtb3ZlKHBvc2l4LmpvaW4oc291cmNlUGF0aCwgJ2Fzc2V0cycpKSxcbiAgICAgICAgXSksXG4gICAgICApLFxuICAgICAgLi4uWy4uLmluZGV4RmlsZXNdLm1hcCgocGF0aCkgPT4gdXBkYXRlSW5kZXhGaWxlKHBhdGgpKSxcbiAgICBdKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIHVzZXMgYSBkeW5hbWljIGltcG9ydCB0byBsb2FkIGEgbW9kdWxlIHdoaWNoIG1heSBiZSBFU00uXG4gKiBDb21tb25KUyBjb2RlIGNhbiBsb2FkIEVTTSBjb2RlIHZpYSBhIGR5bmFtaWMgaW1wb3J0LiBVbmZvcnR1bmF0ZWx5LCBUeXBlU2NyaXB0XG4gKiB3aWxsIGN1cnJlbnRseSwgdW5jb25kaXRpb25hbGx5IGRvd25sZXZlbCBkeW5hbWljIGltcG9ydCBpbnRvIGEgcmVxdWlyZSBjYWxsLlxuICogcmVxdWlyZSBjYWxscyBjYW5ub3QgbG9hZCBFU00gY29kZSBhbmQgd2lsbCByZXN1bHQgaW4gYSBydW50aW1lIGVycm9yLiBUbyB3b3JrYXJvdW5kXG4gKiB0aGlzLCBhIEZ1bmN0aW9uIGNvbnN0cnVjdG9yIGlzIHVzZWQgdG8gcHJldmVudCBUeXBlU2NyaXB0IGZyb20gY2hhbmdpbmcgdGhlIGR5bmFtaWMgaW1wb3J0LlxuICogT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW5cbiAqIGJlIGRyb3BwZWQuXG4gKlxuICogQHBhcmFtIG1vZHVsZVBhdGggVGhlIHBhdGggb2YgdGhlIG1vZHVsZSB0byBsb2FkLlxuICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGR5bmFtaWNhbGx5IGltcG9ydGVkIG1vZHVsZS5cbiAqL1xuZnVuY3Rpb24gbG9hZEVzbU1vZHVsZTxUPihtb2R1bGVQYXRoOiBzdHJpbmcgfCBVUkwpOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIG5ldyBGdW5jdGlvbignbW9kdWxlUGF0aCcsIGByZXR1cm4gaW1wb3J0KG1vZHVsZVBhdGgpO2ApKG1vZHVsZVBhdGgpIGFzIFByb21pc2U8VD47XG59XG4iXX0=