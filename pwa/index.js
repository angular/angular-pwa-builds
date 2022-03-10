"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@schematics/angular/utility/workspace");
const path_1 = require("path");
const stream_1 = require("stream");
function updateIndexFile(path) {
    return async (host) => {
        const buffer = host.read(path);
        if (buffer === null) {
            throw new schematics_1.SchematicsException(`Could not read index file: ${path}`);
        }
        const rewriter = new (await Promise.resolve().then(() => __importStar(require('parse5-html-rewriting-stream')))).default();
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
        var _a, _b, _c;
        if (!options.title) {
            options.title = options.project;
        }
        const workspace = await (0, workspace_1.getWorkspace)(host);
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
        const assetEntry = path_1.posix.join((_a = project.sourceRoot) !== null && _a !== void 0 ? _a : path_1.posix.join(project.root, 'src'), 'manifest.webmanifest');
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
            if (typeof ((_b = target.options) === null || _b === void 0 ? void 0 : _b.index) === 'string') {
                indexFiles.add(target.options.index);
            }
            if (!target.configurations) {
                continue;
            }
            for (const options of Object.values(target.configurations)) {
                if (typeof (options === null || options === void 0 ? void 0 : options.index) === 'string') {
                    indexFiles.add(options.index);
                }
            }
        }
        // Setup sources for the assets files to add to the project
        const sourcePath = (_c = project.sourceRoot) !== null && _c !== void 0 ? _c : path_1.posix.join(project.root, 'src');
        // Setup service worker schematic options
        const { title, ...swOptions } = options;
        return (0, schematics_1.chain)([
            (0, workspace_1.updateWorkspace)(workspace),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJEQVdvQztBQUNwQyxxRUFBc0Y7QUFDdEYsK0JBQTZCO0FBQzdCLG1DQUE0QztBQUc1QyxTQUFTLGVBQWUsQ0FBQyxJQUFZO0lBQ25DLE9BQU8sS0FBSyxFQUFFLElBQVUsRUFBRSxFQUFFO1FBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNyRTtRQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx3REFBYSw4QkFBOEIsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDOUUsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFFBQVEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtnQkFDbkMsYUFBYSxHQUFHLEtBQUssQ0FBQzthQUN2QjtZQUVELFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQy9CLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxNQUFNLEVBQUU7Z0JBQzdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsdURBQXVELENBQUMsQ0FBQztnQkFDMUUsUUFBUSxDQUFDLE9BQU8sQ0FB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QztnQkFDeEIsSUFBQSxpQkFBSSxFQUFDLFlBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3ZDLENBQUMsQ0FDSDtZQUNELEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hELENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUExRkQsNEJBMEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBjaGFpbixcbiAgZXh0ZXJuYWxTY2hlbWF0aWMsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgdGVtcGxhdGUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgZ2V0V29ya3NwYWNlLCB1cGRhdGVXb3Jrc3BhY2UgfSBmcm9tICdAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IHBvc2l4IH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBSZWFkYWJsZSwgV3JpdGFibGUgfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFB3YU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIHVwZGF0ZUluZGV4RmlsZShwYXRoOiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0OiBUcmVlKSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBpbmRleCBmaWxlOiAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmV3cml0ZXIgPSBuZXcgKGF3YWl0IGltcG9ydCgncGFyc2U1LWh0bWwtcmV3cml0aW5nLXN0cmVhbScpKS5kZWZhdWx0KCk7XG4gICAgbGV0IG5lZWRzTm9TY3JpcHQgPSB0cnVlO1xuICAgIHJld3JpdGVyLm9uKCdzdGFydFRhZycsIChzdGFydFRhZykgPT4ge1xuICAgICAgaWYgKHN0YXJ0VGFnLnRhZ05hbWUgPT09ICdub3NjcmlwdCcpIHtcbiAgICAgICAgbmVlZHNOb1NjcmlwdCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcoc3RhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV3cml0ZXIub24oJ2VuZFRhZycsIChlbmRUYWcpID0+IHtcbiAgICAgIGlmIChlbmRUYWcudGFnTmFtZSA9PT0gJ2hlYWQnKSB7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoJyAgPGxpbmsgcmVsPVwibWFuaWZlc3RcIiBocmVmPVwibWFuaWZlc3Qud2VibWFuaWZlc3RcIj5cXG4nKTtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdygnICA8bWV0YSBuYW1lPVwidGhlbWUtY29sb3JcIiBjb250ZW50PVwiIzE5NzZkMlwiPlxcbicpO1xuICAgICAgfSBlbHNlIGlmIChlbmRUYWcudGFnTmFtZSA9PT0gJ2JvZHknICYmIG5lZWRzTm9TY3JpcHQpIHtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhcbiAgICAgICAgICAnICA8bm9zY3JpcHQ+UGxlYXNlIGVuYWJsZSBKYXZhU2NyaXB0IHRvIGNvbnRpbnVlIHVzaW5nIHRoaXMgYXBwbGljYXRpb24uPC9ub3NjcmlwdD5cXG4nLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXdyaXRlci5lbWl0RW5kVGFnKGVuZFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IGlucHV0ID0gbmV3IFJlYWRhYmxlKHtcbiAgICAgICAgZW5jb2Rpbmc6ICd1dGY4JyxcbiAgICAgICAgcmVhZCgpOiB2b2lkIHtcbiAgICAgICAgICB0aGlzLnB1c2goYnVmZmVyKTtcbiAgICAgICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2h1bmtzOiBBcnJheTxCdWZmZXI+ID0gW107XG4gICAgICBjb25zdCBvdXRwdXQgPSBuZXcgV3JpdGFibGUoe1xuICAgICAgICB3cml0ZShjaHVuazogc3RyaW5nIHwgQnVmZmVyLCBlbmNvZGluZzogQnVmZmVyRW5jb2RpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICAgIGNodW5rcy5wdXNoKHR5cGVvZiBjaHVuayA9PT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjaHVuaywgZW5jb2RpbmcpIDogY2h1bmspO1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKGNhbGxiYWNrOiAoZXJyb3I/OiBFcnJvcikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgIGNvbnN0IGZ1bGwgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG4gICAgICAgICAgaG9zdC5vdmVyd3JpdGUocGF0aCwgZnVsbC50b1N0cmluZygpKTtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBpbnB1dC5waXBlKHJld3JpdGVyKS5waXBlKG91dHB1dCk7XG4gICAgfSk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdCkgPT4ge1xuICAgIGlmICghb3B0aW9ucy50aXRsZSkge1xuICAgICAgb3B0aW9ucy50aXRsZSA9IG9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgaXMgbm90IGRlZmluZWQgaW4gdGhpcyB3b3Jrc3BhY2UuYCk7XG4gICAgfVxuXG4gICAgaWYgKHByb2plY3QuZXh0ZW5zaW9uc1sncHJvamVjdFR5cGUnXSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFBXQSByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIuYCk7XG4gICAgfVxuXG4gICAgLy8gRmluZCBhbGwgdGhlIHJlbGV2YW50IHRhcmdldHMgZm9yIHRoZSBwcm9qZWN0XG4gICAgaWYgKHByb2plY3QudGFyZ2V0cy5zaXplID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgVGFyZ2V0cyBhcmUgbm90IGRlZmluZWQgZm9yIHRoaXMgcHJvamVjdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZFRhcmdldHMgPSBbXTtcbiAgICBjb25zdCB0ZXN0VGFyZ2V0cyA9IFtdO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cy52YWx1ZXMoKSkge1xuICAgICAgaWYgKHRhcmdldC5idWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6YnJvd3NlcicpIHtcbiAgICAgICAgYnVpbGRUYXJnZXRzLnB1c2godGFyZ2V0KTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjprYXJtYScpIHtcbiAgICAgICAgdGVzdFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBtYW5pZmVzdCB0byBhc3NldCBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgYXNzZXRFbnRyeSA9IHBvc2l4LmpvaW4oXG4gICAgICBwcm9qZWN0LnNvdXJjZVJvb3QgPz8gcG9zaXguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKSxcbiAgICAgICdtYW5pZmVzdC53ZWJtYW5pZmVzdCcsXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBbLi4uYnVpbGRUYXJnZXRzLCAuLi50ZXN0VGFyZ2V0c10pIHtcbiAgICAgIGlmICh0YXJnZXQub3B0aW9ucykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQub3B0aW9ucy5hc3NldHMpKSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzLnB1c2goYXNzZXRFbnRyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzID0gW2Fzc2V0RW50cnldO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXQub3B0aW9ucyA9IHsgYXNzZXRzOiBbYXNzZXRFbnRyeV0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCBpbmRleC5odG1sIGZpbGVzIGluIGJ1aWxkIHRhcmdldHNcbiAgICBjb25zdCBpbmRleEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgYnVpbGRUYXJnZXRzKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldC5vcHRpb25zPy5pbmRleCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW5kZXhGaWxlcy5hZGQodGFyZ2V0Lm9wdGlvbnMuaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRhcmdldC5jb25maWd1cmF0aW9ucykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBvcHRpb25zIG9mIE9iamVjdC52YWx1ZXModGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnM/LmluZGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGluZGV4RmlsZXMuYWRkKG9wdGlvbnMuaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0dXAgc291cmNlcyBmb3IgdGhlIGFzc2V0cyBmaWxlcyB0byBhZGQgdG8gdGhlIHByb2plY3RcbiAgICBjb25zdCBzb3VyY2VQYXRoID0gcHJvamVjdC5zb3VyY2VSb290ID8/IHBvc2l4LmpvaW4ocHJvamVjdC5yb290LCAnc3JjJyk7XG5cbiAgICAvLyBTZXR1cCBzZXJ2aWNlIHdvcmtlciBzY2hlbWF0aWMgb3B0aW9uc1xuICAgIGNvbnN0IHsgdGl0bGUsIC4uLnN3T3B0aW9ucyB9ID0gb3B0aW9ucztcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICB1cGRhdGVXb3Jrc3BhY2Uod29ya3NwYWNlKSxcbiAgICAgIGV4dGVybmFsU2NoZW1hdGljKCdAc2NoZW1hdGljcy9hbmd1bGFyJywgJ3NlcnZpY2Utd29ya2VyJywgc3dPcHRpb25zKSxcbiAgICAgIG1lcmdlV2l0aChhcHBseSh1cmwoJy4vZmlsZXMvcm9vdCcpLCBbdGVtcGxhdGUoeyAuLi5vcHRpb25zIH0pLCBtb3ZlKHNvdXJjZVBhdGgpXSkpLFxuICAgICAgbWVyZ2VXaXRoKFxuICAgICAgICBhcHBseSh1cmwoJy4vZmlsZXMvYXNzZXRzJyksIFtcbiAgICAgICAgICB0ZW1wbGF0ZSh7IC4uLm9wdGlvbnMgfSksXG4gICAgICAgICAgbW92ZShwb3NpeC5qb2luKHNvdXJjZVBhdGgsICdhc3NldHMnKSksXG4gICAgICAgIF0pLFxuICAgICAgKSxcbiAgICAgIC4uLlsuLi5pbmRleEZpbGVzXS5tYXAoKHBhdGgpID0+IHVwZGF0ZUluZGV4RmlsZShwYXRoKSksXG4gICAgXSk7XG4gIH07XG59XG4iXX0=