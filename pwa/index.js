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
const utility_1 = require("@schematics/angular/utility");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJEQVdvQztBQUNwQyx5REFBNEU7QUFDNUUsK0JBQTZCO0FBQzdCLG1DQUE0QztBQUc1QyxTQUFTLGVBQWUsQ0FBQyxJQUFZO0lBQ25DLE9BQU8sS0FBSyxFQUFFLElBQVUsRUFBRSxFQUFFO1FBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNyRTtRQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx3REFBYSw4QkFBOEIsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDOUUsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFFBQVEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtnQkFDbkMsYUFBYSxHQUFHLEtBQUssQ0FBQzthQUN2QjtZQUVELFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQy9CLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxNQUFNLEVBQUU7Z0JBQzdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsdURBQXVELENBQUMsQ0FBQztnQkFDMUUsUUFBUSxDQUFDLE9BQU8sQ0FB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RSxHQUFHLE9BQU8sRUFBRSxDQUFDO2dCQUN4QixJQUFBLGlCQUFJLEVBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDdkMsQ0FBQyxDQUNIO1lBQ0QsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTNGRCw0QkEyRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGNoYWluLFxuICBleHRlcm5hbFNjaGVtYXRpYyxcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyByZWFkV29ya3NwYWNlLCB3cml0ZVdvcmtzcGFjZSB9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eSc7XG5pbXBvcnQgeyBwb3NpeCB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUmVhZGFibGUsIFdyaXRhYmxlIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IFNjaGVtYSBhcyBQd2FPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5mdW5jdGlvbiB1cGRhdGVJbmRleEZpbGUocGF0aDogc3RyaW5nKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZChwYXRoKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgaW5kZXggZmlsZTogJHtwYXRofWApO1xuICAgIH1cblxuICAgIGNvbnN0IHJld3JpdGVyID0gbmV3IChhd2FpdCBpbXBvcnQoJ3BhcnNlNS1odG1sLXJld3JpdGluZy1zdHJlYW0nKSkuZGVmYXVsdCgpO1xuICAgIGxldCBuZWVkc05vU2NyaXB0ID0gdHJ1ZTtcbiAgICByZXdyaXRlci5vbignc3RhcnRUYWcnLCAoc3RhcnRUYWcpID0+IHtcbiAgICAgIGlmIChzdGFydFRhZy50YWdOYW1lID09PSAnbm9zY3JpcHQnKSB7XG4gICAgICAgIG5lZWRzTm9TY3JpcHQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdFN0YXJ0VGFnKHN0YXJ0VGFnKTtcbiAgICB9KTtcblxuICAgIHJld3JpdGVyLm9uKCdlbmRUYWcnLCAoZW5kVGFnKSA9PiB7XG4gICAgICBpZiAoZW5kVGFnLnRhZ05hbWUgPT09ICdoZWFkJykge1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KCcgIDxsaW5rIHJlbD1cIm1hbmlmZXN0XCIgaHJlZj1cIm1hbmlmZXN0LndlYm1hbmlmZXN0XCI+XFxuJyk7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoJyAgPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMxOTc2ZDJcIj5cXG4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZW5kVGFnLnRhZ05hbWUgPT09ICdib2R5JyAmJiBuZWVkc05vU2NyaXB0KSB7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoXG4gICAgICAgICAgJyAgPG5vc2NyaXB0PlBsZWFzZSBlbmFibGUgSmF2YVNjcmlwdCB0byBjb250aW51ZSB1c2luZyB0aGlzIGFwcGxpY2F0aW9uLjwvbm9zY3JpcHQ+XFxuJyxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdEVuZFRhZyhlbmRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbnB1dCA9IG5ldyBSZWFkYWJsZSh7XG4gICAgICAgIGVuY29kaW5nOiAndXRmOCcsXG4gICAgICAgIHJlYWQoKTogdm9pZCB7XG4gICAgICAgICAgdGhpcy5wdXNoKGJ1ZmZlcik7XG4gICAgICAgICAgdGhpcy5wdXNoKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNodW5rczogQXJyYXk8QnVmZmVyPiA9IFtdO1xuICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFdyaXRhYmxlKHtcbiAgICAgICAgd3JpdGUoY2h1bms6IHN0cmluZyB8IEJ1ZmZlciwgZW5jb2Rpbmc6IEJ1ZmZlckVuY29kaW5nLCBjYWxsYmFjazogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgICBjaHVua3MucHVzaCh0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnID8gQnVmZmVyLmZyb20oY2h1bmssIGVuY29kaW5nKSA6IGNodW5rKTtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbChjYWxsYmFjazogKGVycm9yPzogRXJyb3IpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgICBjb25zdCBmdWxsID0gQnVmZmVyLmNvbmNhdChjaHVua3MpO1xuICAgICAgICAgIGhvc3Qub3ZlcndyaXRlKHBhdGgsIGZ1bGwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgaW5wdXQucGlwZShyZXdyaXRlcikucGlwZShvdXRwdXQpO1xuICAgIH0pO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3QpID0+IHtcbiAgICBpZiAoIW9wdGlvbnMudGl0bGUpIHtcbiAgICAgIG9wdGlvbnMudGl0bGUgPSBvcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgcmVhZFdvcmtzcGFjZShob3N0KTtcblxuICAgIGlmICghb3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignT3B0aW9uIFwicHJvamVjdFwiIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5leHRlbnNpb25zWydwcm9qZWN0VHlwZSddICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUFdBIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCB0aGUgcmVsZXZhbnQgdGFyZ2V0cyBmb3IgdGhlIHByb2plY3RcbiAgICBpZiAocHJvamVjdC50YXJnZXRzLnNpemUgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBUYXJnZXRzIGFyZSBub3QgZGVmaW5lZCBmb3IgdGhpcyBwcm9qZWN0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkVGFyZ2V0cyA9IFtdO1xuICAgIGNvbnN0IHRlc3RUYXJnZXRzID0gW107XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzLnZhbHVlcygpKSB7XG4gICAgICBpZiAodGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjpicm93c2VyJykge1xuICAgICAgICBidWlsZFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQuYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmthcm1hJykge1xuICAgICAgICB0ZXN0VGFyZ2V0cy5wdXNoKHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRkIG1hbmlmZXN0IHRvIGFzc2V0IGNvbmZpZ3VyYXRpb25cbiAgICBjb25zdCBhc3NldEVudHJ5ID0gcG9zaXguam9pbihcbiAgICAgIHByb2plY3Quc291cmNlUm9vdCA/PyBwb3NpeC5qb2luKHByb2plY3Qucm9vdCwgJ3NyYycpLFxuICAgICAgJ21hbmlmZXN0LndlYm1hbmlmZXN0JyxcbiAgICApO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIFsuLi5idWlsZFRhcmdldHMsIC4uLnRlc3RUYXJnZXRzXSkge1xuICAgICAgaWYgKHRhcmdldC5vcHRpb25zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldC5vcHRpb25zLmFzc2V0cykpIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMucHVzaChhc3NldEVudHJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMgPSBbYXNzZXRFbnRyeV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldC5vcHRpb25zID0geyBhc3NldHM6IFthc3NldEVudHJ5XSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIGluZGV4Lmh0bWwgZmlsZXMgaW4gYnVpbGQgdGFyZ2V0c1xuICAgIGNvbnN0IGluZGV4RmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBidWlsZFRhcmdldHMpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0Lm9wdGlvbnM/LmluZGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbmRleEZpbGVzLmFkZCh0YXJnZXQub3B0aW9ucy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbnMgb2YgT2JqZWN0LnZhbHVlcyh0YXJnZXQuY29uZmlndXJhdGlvbnMpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucz8uaW5kZXggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaW5kZXhGaWxlcy5hZGQob3B0aW9ucy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXR1cCBzb3VyY2VzIGZvciB0aGUgYXNzZXRzIGZpbGVzIHRvIGFkZCB0byB0aGUgcHJvamVjdFxuICAgIGNvbnN0IHNvdXJjZVBhdGggPSBwcm9qZWN0LnNvdXJjZVJvb3QgPz8gcG9zaXguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKTtcblxuICAgIC8vIFNldHVwIHNlcnZpY2Ugd29ya2VyIHNjaGVtYXRpYyBvcHRpb25zXG4gICAgY29uc3QgeyB0aXRsZSwgLi4uc3dPcHRpb25zIH0gPSBvcHRpb25zO1xuXG4gICAgYXdhaXQgd3JpdGVXb3Jrc3BhY2UoaG9zdCwgd29ya3NwYWNlKTtcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICBleHRlcm5hbFNjaGVtYXRpYygnQHNjaGVtYXRpY3MvYW5ndWxhcicsICdzZXJ2aWNlLXdvcmtlcicsIHN3T3B0aW9ucyksXG4gICAgICBtZXJnZVdpdGgoYXBwbHkodXJsKCcuL2ZpbGVzL3Jvb3QnKSwgW3RlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSwgbW92ZShzb3VyY2VQYXRoKV0pKSxcbiAgICAgIG1lcmdlV2l0aChcbiAgICAgICAgYXBwbHkodXJsKCcuL2ZpbGVzL2Fzc2V0cycpLCBbXG4gICAgICAgICAgdGVtcGxhdGUoeyAuLi5vcHRpb25zIH0pLFxuICAgICAgICAgIG1vdmUocG9zaXguam9pbihzb3VyY2VQYXRoLCAnYXNzZXRzJykpLFxuICAgICAgICBdKSxcbiAgICAgICksXG4gICAgICAuLi5bLi4uaW5kZXhGaWxlc10ubWFwKChwYXRoKSA9PiB1cGRhdGVJbmRleEZpbGUocGF0aCkpLFxuICAgIF0pO1xuICB9O1xufVxuIl19