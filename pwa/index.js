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
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkRBV29DO0FBQ3BDLHFFQUFzRjtBQUN0RiwrQkFBNkI7QUFDN0IsbUNBQTRDO0FBRzVDLFNBQVMsZUFBZSxDQUFDLElBQVk7SUFDbkMsT0FBTyxLQUFLLEVBQUUsSUFBVSxFQUFFLEVBQUU7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7WUFDbkIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLDhCQUE4QixJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3JFO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHdEQUFhLDhCQUE4QixHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5RSxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDekIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNuQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2FBQ3ZCO1lBRUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO2dCQUMxRSxRQUFRLENBQUMsT0FBTyxDQUFDLGlE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QUN4QixJQUFBLGlCQUFJLEVBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDdkMsQ0FBQyxDQUNIO1lBQ0QsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTFGRCw0QkEwRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGNoYWluLFxuICBleHRlcm5hbFNjaGVtYXRpYyxcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UsIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS93b3Jrc3BhY2UnO1xuaW1wb3J0IHsgcG9zaXggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFJlYWRhYmxlLCBXcml0YWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgUHdhT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuZnVuY3Rpb24gdXBkYXRlSW5kZXhGaWxlKHBhdGg6IHN0cmluZyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSBob3N0LnJlYWQocGF0aCk7XG4gICAgaWYgKGJ1ZmZlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCByZWFkIGluZGV4IGZpbGU6ICR7cGF0aH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXdyaXRlciA9IG5ldyAoYXdhaXQgaW1wb3J0KCdwYXJzZTUtaHRtbC1yZXdyaXRpbmctc3RyZWFtJykpLmRlZmF1bHQoKTtcbiAgICBsZXQgbmVlZHNOb1NjcmlwdCA9IHRydWU7XG4gICAgcmV3cml0ZXIub24oJ3N0YXJ0VGFnJywgKHN0YXJ0VGFnKSA9PiB7XG4gICAgICBpZiAoc3RhcnRUYWcudGFnTmFtZSA9PT0gJ25vc2NyaXB0Jykge1xuICAgICAgICBuZWVkc05vU2NyaXB0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyhzdGFydFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXdyaXRlci5vbignZW5kVGFnJywgKGVuZFRhZykgPT4ge1xuICAgICAgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnaGVhZCcpIHtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdygnICA8bGluayByZWw9XCJtYW5pZmVzdFwiIGhyZWY9XCJtYW5pZmVzdC53ZWJtYW5pZmVzdFwiPlxcbicpO1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KCcgIDxtZXRhIG5hbWU9XCJ0aGVtZS1jb2xvclwiIGNvbnRlbnQ9XCIjMTk3NmQyXCI+XFxuJyk7XG4gICAgICB9IGVsc2UgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnYm9keScgJiYgbmVlZHNOb1NjcmlwdCkge1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KFxuICAgICAgICAgICcgIDxub3NjcmlwdD5QbGVhc2UgZW5hYmxlIEphdmFTY3JpcHQgdG8gY29udGludWUgdXNpbmcgdGhpcyBhcHBsaWNhdGlvbi48L25vc2NyaXB0PlxcbicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRFbmRUYWcoZW5kVGFnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSBuZXcgUmVhZGFibGUoe1xuICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICByZWFkKCk6IHZvaWQge1xuICAgICAgICAgIHRoaXMucHVzaChidWZmZXIpO1xuICAgICAgICAgIHRoaXMucHVzaChudWxsKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaHVua3M6IEFycmF5PEJ1ZmZlcj4gPSBbXTtcbiAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBXcml0YWJsZSh7XG4gICAgICAgIHdyaXRlKGNodW5rOiBzdHJpbmcgfCBCdWZmZXIsIGVuY29kaW5nOiBCdWZmZXJFbmNvZGluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgICAgY2h1bmtzLnB1c2godHlwZW9mIGNodW5rID09PSAnc3RyaW5nJyA/IEJ1ZmZlci5mcm9tKGNodW5rLCBlbmNvZGluZykgOiBjaHVuayk7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluYWwoY2FsbGJhY2s6IChlcnJvcj86IEVycm9yKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgICAgY29uc3QgZnVsbCA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKTtcbiAgICAgICAgICBob3N0Lm92ZXJ3cml0ZShwYXRoLCBmdWxsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGlucHV0LnBpcGUocmV3cml0ZXIpLnBpcGUob3V0cHV0KTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0KSA9PiB7XG4gICAgaWYgKCFvcHRpb25zLnRpdGxlKSB7XG4gICAgICBvcHRpb25zLnRpdGxlID0gb3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcblxuICAgIGlmICghb3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignT3B0aW9uIFwicHJvamVjdFwiIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5leHRlbnNpb25zWydwcm9qZWN0VHlwZSddICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUFdBIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCB0aGUgcmVsZXZhbnQgdGFyZ2V0cyBmb3IgdGhlIHByb2plY3RcbiAgICBpZiAocHJvamVjdC50YXJnZXRzLnNpemUgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBUYXJnZXRzIGFyZSBub3QgZGVmaW5lZCBmb3IgdGhpcyBwcm9qZWN0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkVGFyZ2V0cyA9IFtdO1xuICAgIGNvbnN0IHRlc3RUYXJnZXRzID0gW107XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzLnZhbHVlcygpKSB7XG4gICAgICBpZiAodGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjpicm93c2VyJykge1xuICAgICAgICBidWlsZFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQuYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmthcm1hJykge1xuICAgICAgICB0ZXN0VGFyZ2V0cy5wdXNoKHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRkIG1hbmlmZXN0IHRvIGFzc2V0IGNvbmZpZ3VyYXRpb25cbiAgICBjb25zdCBhc3NldEVudHJ5ID0gcG9zaXguam9pbihcbiAgICAgIHByb2plY3Quc291cmNlUm9vdCA/PyBwb3NpeC5qb2luKHByb2plY3Qucm9vdCwgJ3NyYycpLFxuICAgICAgJ21hbmlmZXN0LndlYm1hbmlmZXN0JyxcbiAgICApO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIFsuLi5idWlsZFRhcmdldHMsIC4uLnRlc3RUYXJnZXRzXSkge1xuICAgICAgaWYgKHRhcmdldC5vcHRpb25zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldC5vcHRpb25zLmFzc2V0cykpIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMucHVzaChhc3NldEVudHJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMgPSBbYXNzZXRFbnRyeV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldC5vcHRpb25zID0geyBhc3NldHM6IFthc3NldEVudHJ5XSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIGluZGV4Lmh0bWwgZmlsZXMgaW4gYnVpbGQgdGFyZ2V0c1xuICAgIGNvbnN0IGluZGV4RmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBidWlsZFRhcmdldHMpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0Lm9wdGlvbnM/LmluZGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbmRleEZpbGVzLmFkZCh0YXJnZXQub3B0aW9ucy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbnMgb2YgT2JqZWN0LnZhbHVlcyh0YXJnZXQuY29uZmlndXJhdGlvbnMpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucz8uaW5kZXggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaW5kZXhGaWxlcy5hZGQob3B0aW9ucy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXR1cCBzb3VyY2VzIGZvciB0aGUgYXNzZXRzIGZpbGVzIHRvIGFkZCB0byB0aGUgcHJvamVjdFxuICAgIGNvbnN0IHNvdXJjZVBhdGggPSBwcm9qZWN0LnNvdXJjZVJvb3QgPz8gcG9zaXguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKTtcblxuICAgIC8vIFNldHVwIHNlcnZpY2Ugd29ya2VyIHNjaGVtYXRpYyBvcHRpb25zXG4gICAgY29uc3QgeyB0aXRsZSwgLi4uc3dPcHRpb25zIH0gPSBvcHRpb25zO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIHVwZGF0ZVdvcmtzcGFjZSh3b3Jrc3BhY2UpLFxuICAgICAgZXh0ZXJuYWxTY2hlbWF0aWMoJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLCAnc2VydmljZS13b3JrZXInLCBzd09wdGlvbnMpLFxuICAgICAgbWVyZ2VXaXRoKGFwcGx5KHVybCgnLi9maWxlcy9yb290JyksIFt0ZW1wbGF0ZSh7IC4uLm9wdGlvbnMgfSksIG1vdmUoc291cmNlUGF0aCldKSksXG4gICAgICBtZXJnZVdpdGgoXG4gICAgICAgIGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW1xuICAgICAgICAgIHRlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSxcbiAgICAgICAgICBtb3ZlKHBvc2l4LmpvaW4oc291cmNlUGF0aCwgJ2Fzc2V0cycpKSxcbiAgICAgICAgXSksXG4gICAgICApLFxuICAgICAgLi4uWy4uLmluZGV4RmlsZXNdLm1hcCgocGF0aCkgPT4gdXBkYXRlSW5kZXhGaWxlKHBhdGgpKSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==