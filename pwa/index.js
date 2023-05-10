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
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files/assets'), [(0, schematics_1.move)(path_1.posix.join(sourcePath, 'assets'))])),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwyREFXb0M7QUFDcEMseURBQTRFO0FBQzVFLCtCQUE2QjtBQUM3QixtQ0FBNEM7QUFHNUMsU0FBUyxlQUFlLENBQUMsSUFBWTtJQUNuQyxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsRUFBRTtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtZQUNuQixNQUFNLElBQUksZ0NBQW1CLENBQUMsOEJBQThCLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckU7UUFFRCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxhQUFhLENBQzdDLDhCQUE4QixDQUMvQixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN2QyxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDekIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNuQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2FBQ3ZCO1lBRUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO2dCQUMxRSxRQUFRLENBQUMs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QUM7WUFDakYsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXRGRCw0QkFzRkM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILFNBQVMsYUFBYSxDQUFJLFVBQXdCO0lBQ2hELE9BQU8sSUFBSSxRQUFRLENBQUMsWUFBWSxFQUFFLDRCQUE0QixDQUFDLENBQUMsVUFBVSxDQUFlLENBQUM7QUFDNUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxuICBUcmVlLFxuICBhcHBseSxcbiAgY2hhaW4sXG4gIGV4dGVybmFsU2NoZW1hdGljLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIHRlbXBsYXRlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IHJlYWRXb3Jrc3BhY2UsIHdyaXRlV29ya3NwYWNlIH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5JztcbmltcG9ydCB7IHBvc2l4IH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBSZWFkYWJsZSwgV3JpdGFibGUgfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFB3YU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIHVwZGF0ZUluZGV4RmlsZShwYXRoOiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0OiBUcmVlKSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBpbmRleCBmaWxlOiAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBSZXdyaXRpbmdTdHJlYW0gfSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgncGFyc2U1LWh0bWwtcmV3cml0aW5nLXN0cmVhbScpPihcbiAgICAgICdwYXJzZTUtaHRtbC1yZXdyaXRpbmctc3RyZWFtJyxcbiAgICApO1xuXG4gICAgY29uc3QgcmV3cml0ZXIgPSBuZXcgUmV3cml0aW5nU3RyZWFtKCk7XG4gICAgbGV0IG5lZWRzTm9TY3JpcHQgPSB0cnVlO1xuICAgIHJld3JpdGVyLm9uKCdzdGFydFRhZycsIChzdGFydFRhZykgPT4ge1xuICAgICAgaWYgKHN0YXJ0VGFnLnRhZ05hbWUgPT09ICdub3NjcmlwdCcpIHtcbiAgICAgICAgbmVlZHNOb1NjcmlwdCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcoc3RhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV3cml0ZXIub24oJ2VuZFRhZycsIChlbmRUYWcpID0+IHtcbiAgICAgIGlmIChlbmRUYWcudGFnTmFtZSA9PT0gJ2hlYWQnKSB7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoJyAgPGxpbmsgcmVsPVwibWFuaWZlc3RcIiBocmVmPVwibWFuaWZlc3Qud2VibWFuaWZlc3RcIj5cXG4nKTtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdygnICA8bWV0YSBuYW1lPVwidGhlbWUtY29sb3JcIiBjb250ZW50PVwiIzE5NzZkMlwiPlxcbicpO1xuICAgICAgfSBlbHNlIGlmIChlbmRUYWcudGFnTmFtZSA9PT0gJ2JvZHknICYmIG5lZWRzTm9TY3JpcHQpIHtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhcbiAgICAgICAgICAnICA8bm9zY3JpcHQ+UGxlYXNlIGVuYWJsZSBKYXZhU2NyaXB0IHRvIGNvbnRpbnVlIHVzaW5nIHRoaXMgYXBwbGljYXRpb24uPC9ub3NjcmlwdD5cXG4nLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXdyaXRlci5lbWl0RW5kVGFnKGVuZFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IGlucHV0ID0gbmV3IFJlYWRhYmxlKHtcbiAgICAgICAgZW5jb2Rpbmc6ICd1dGY4JyxcbiAgICAgICAgcmVhZCgpOiB2b2lkIHtcbiAgICAgICAgICB0aGlzLnB1c2goYnVmZmVyKTtcbiAgICAgICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2h1bmtzOiBBcnJheTxCdWZmZXI+ID0gW107XG4gICAgICBjb25zdCBvdXRwdXQgPSBuZXcgV3JpdGFibGUoe1xuICAgICAgICB3cml0ZShjaHVuazogc3RyaW5nIHwgQnVmZmVyLCBlbmNvZGluZzogQnVmZmVyRW5jb2RpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICAgIGNodW5rcy5wdXNoKHR5cGVvZiBjaHVuayA9PT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjaHVuaywgZW5jb2RpbmcpIDogY2h1bmspO1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKGNhbGxiYWNrOiAoZXJyb3I/OiBFcnJvcikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgIGNvbnN0IGZ1bGwgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG4gICAgICAgICAgaG9zdC5vdmVyd3JpdGUocGF0aCwgZnVsbC50b1N0cmluZygpKTtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBpbnB1dC5waXBlKHJld3JpdGVyKS5waXBlKG91dHB1dCk7XG4gICAgfSk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdCkgPT4ge1xuICAgIGlmICghb3B0aW9ucy50aXRsZSkge1xuICAgICAgb3B0aW9ucy50aXRsZSA9IG9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCByZWFkV29ya3NwYWNlKGhvc3QpO1xuXG4gICAgaWYgKCFvcHRpb25zLnByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdPcHRpb24gXCJwcm9qZWN0XCIgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQob3B0aW9ucy5wcm9qZWN0KTtcbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBQcm9qZWN0IGlzIG5vdCBkZWZpbmVkIGluIHRoaXMgd29ya3NwYWNlLmApO1xuICAgIH1cblxuICAgIGlmIChwcm9qZWN0LmV4dGVuc2lvbnNbJ3Byb2plY3RUeXBlJ10gIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBQV0EgcmVxdWlyZXMgYSBwcm9qZWN0IHR5cGUgb2YgXCJhcHBsaWNhdGlvblwiLmApO1xuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIHRoZSByZWxldmFudCB0YXJnZXRzIGZvciB0aGUgcHJvamVjdFxuICAgIGlmIChwcm9qZWN0LnRhcmdldHMuc2l6ZSA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFRhcmdldHMgYXJlIG5vdCBkZWZpbmVkIGZvciB0aGlzIHByb2plY3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRUYXJnZXRzID0gW107XG4gICAgY29uc3QgdGVzdFRhcmdldHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMudmFsdWVzKCkpIHtcbiAgICAgIGlmICh0YXJnZXQuYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmJyb3dzZXInKSB7XG4gICAgICAgIGJ1aWxkVGFyZ2V0cy5wdXNoKHRhcmdldCk7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldC5idWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6a2FybWEnKSB7XG4gICAgICAgIHRlc3RUYXJnZXRzLnB1c2godGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgbWFuaWZlc3QgdG8gYXNzZXQgY29uZmlndXJhdGlvblxuICAgIGNvbnN0IGFzc2V0RW50cnkgPSBwb3NpeC5qb2luKFxuICAgICAgcHJvamVjdC5zb3VyY2VSb290ID8/IHBvc2l4LmpvaW4ocHJvamVjdC5yb290LCAnc3JjJyksXG4gICAgICAnbWFuaWZlc3Qud2VibWFuaWZlc3QnLFxuICAgICk7XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgWy4uLmJ1aWxkVGFyZ2V0cywgLi4udGVzdFRhcmdldHNdKSB7XG4gICAgICBpZiAodGFyZ2V0Lm9wdGlvbnMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGFyZ2V0Lm9wdGlvbnMuYXNzZXRzKSkge1xuICAgICAgICAgIHRhcmdldC5vcHRpb25zLmFzc2V0cy5wdXNoKGFzc2V0RW50cnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhcmdldC5vcHRpb25zLmFzc2V0cyA9IFthc3NldEVudHJ5XTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0Lm9wdGlvbnMgPSB7IGFzc2V0czogW2Fzc2V0RW50cnldIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluZCBhbGwgaW5kZXguaHRtbCBmaWxlcyBpbiBidWlsZCB0YXJnZXRzXG4gICAgY29uc3QgaW5kZXhGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIGJ1aWxkVGFyZ2V0cykge1xuICAgICAgaWYgKHR5cGVvZiB0YXJnZXQub3B0aW9ucz8uaW5kZXggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGluZGV4RmlsZXMuYWRkKHRhcmdldC5vcHRpb25zLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0YXJnZXQuY29uZmlndXJhdGlvbnMpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3Qgb3B0aW9ucyBvZiBPYmplY3QudmFsdWVzKHRhcmdldC5jb25maWd1cmF0aW9ucykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zPy5pbmRleCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBpbmRleEZpbGVzLmFkZChvcHRpb25zLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHVwIHNvdXJjZXMgZm9yIHRoZSBhc3NldHMgZmlsZXMgdG8gYWRkIHRvIHRoZSBwcm9qZWN0XG4gICAgY29uc3Qgc291cmNlUGF0aCA9IHByb2plY3Quc291cmNlUm9vdCA/PyBwb3NpeC5qb2luKHByb2plY3Qucm9vdCwgJ3NyYycpO1xuXG4gICAgLy8gU2V0dXAgc2VydmljZSB3b3JrZXIgc2NoZW1hdGljIG9wdGlvbnNcbiAgICBjb25zdCB7IHRpdGxlLCAuLi5zd09wdGlvbnMgfSA9IG9wdGlvbnM7XG5cbiAgICBhd2FpdCB3cml0ZVdvcmtzcGFjZShob3N0LCB3b3Jrc3BhY2UpO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIGV4dGVybmFsU2NoZW1hdGljKCdAc2NoZW1hdGljcy9hbmd1bGFyJywgJ3NlcnZpY2Utd29ya2VyJywgc3dPcHRpb25zKSxcbiAgICAgIG1lcmdlV2l0aChhcHBseSh1cmwoJy4vZmlsZXMvcm9vdCcpLCBbdGVtcGxhdGUoeyAuLi5vcHRpb25zIH0pLCBtb3ZlKHNvdXJjZVBhdGgpXSkpLFxuICAgICAgbWVyZ2VXaXRoKGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW21vdmUocG9zaXguam9pbihzb3VyY2VQYXRoLCAnYXNzZXRzJykpXSkpLFxuICAgICAgLi4uWy4uLmluZGV4RmlsZXNdLm1hcCgocGF0aCkgPT4gdXBkYXRlSW5kZXhGaWxlKHBhdGgpKSxcbiAgICBdKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIHVzZXMgYSBkeW5hbWljIGltcG9ydCB0byBsb2FkIGEgbW9kdWxlIHdoaWNoIG1heSBiZSBFU00uXG4gKiBDb21tb25KUyBjb2RlIGNhbiBsb2FkIEVTTSBjb2RlIHZpYSBhIGR5bmFtaWMgaW1wb3J0LiBVbmZvcnR1bmF0ZWx5LCBUeXBlU2NyaXB0XG4gKiB3aWxsIGN1cnJlbnRseSwgdW5jb25kaXRpb25hbGx5IGRvd25sZXZlbCBkeW5hbWljIGltcG9ydCBpbnRvIGEgcmVxdWlyZSBjYWxsLlxuICogcmVxdWlyZSBjYWxscyBjYW5ub3QgbG9hZCBFU00gY29kZSBhbmQgd2lsbCByZXN1bHQgaW4gYSBydW50aW1lIGVycm9yLiBUbyB3b3JrYXJvdW5kXG4gKiB0aGlzLCBhIEZ1bmN0aW9uIGNvbnN0cnVjdG9yIGlzIHVzZWQgdG8gcHJldmVudCBUeXBlU2NyaXB0IGZyb20gY2hhbmdpbmcgdGhlIGR5bmFtaWMgaW1wb3J0LlxuICogT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW5cbiAqIGJlIGRyb3BwZWQuXG4gKlxuICogQHBhcmFtIG1vZHVsZVBhdGggVGhlIHBhdGggb2YgdGhlIG1vZHVsZSB0byBsb2FkLlxuICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGR5bmFtaWNhbGx5IGltcG9ydGVkIG1vZHVsZS5cbiAqL1xuZnVuY3Rpb24gbG9hZEVzbU1vZHVsZTxUPihtb2R1bGVQYXRoOiBzdHJpbmcgfCBVUkwpOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIG5ldyBGdW5jdGlvbignbW9kdWxlUGF0aCcsIGByZXR1cm4gaW1wb3J0KG1vZHVsZVBhdGgpO2ApKG1vZHVsZVBhdGgpIGFzIFByb21pc2U8VD47XG59XG4iXX0=