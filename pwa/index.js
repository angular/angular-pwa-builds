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
            if (target.builder === '@angular-devkit/build-angular:browser' ||
                target.builder === '@angular-devkit/build-angular:application') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL3B3YS9wd2EvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwyREFXb0M7QUFDcEMseURBQTRFO0FBQzVFLCtCQUE2QjtBQUM3QixtQ0FBNEM7QUFHNUMsU0FBUyxlQUFlLENBQUMsSUFBWTtJQUNuQyxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsRUFBRTtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtZQUNuQixNQUFNLElBQUksZ0NBQW1CLENBQUMsOEJBQThCLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckU7UUFFRCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxhQUFhLENBQzdDLDhCQUE4QixDQUMvQixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN2QyxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDekIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNuQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2FBQ3ZCO1lBRUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsUUFBUSxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO2dCQUMxRSxRQUFRLENBQUMs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VSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hELENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUF6RkQsNEJBeUZDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFTLGFBQWEsQ0FBSSxVQUF3QjtJQUNoRCxPQUFPLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLFVBQVUsQ0FBZSxDQUFDO0FBQzVGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGNoYWluLFxuICBleHRlcm5hbFNjaGVtYXRpYyxcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyByZWFkV29ya3NwYWNlLCB3cml0ZVdvcmtzcGFjZSB9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eSc7XG5pbXBvcnQgeyBwb3NpeCB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUmVhZGFibGUsIFdyaXRhYmxlIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IFNjaGVtYSBhcyBQd2FPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5mdW5jdGlvbiB1cGRhdGVJbmRleEZpbGUocGF0aDogc3RyaW5nKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZChwYXRoKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgaW5kZXggZmlsZTogJHtwYXRofWApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgUmV3cml0aW5nU3RyZWFtIH0gPSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ3BhcnNlNS1odG1sLXJld3JpdGluZy1zdHJlYW0nKT4oXG4gICAgICAncGFyc2U1LWh0bWwtcmV3cml0aW5nLXN0cmVhbScsXG4gICAgKTtcblxuICAgIGNvbnN0IHJld3JpdGVyID0gbmV3IFJld3JpdGluZ1N0cmVhbSgpO1xuICAgIGxldCBuZWVkc05vU2NyaXB0ID0gdHJ1ZTtcbiAgICByZXdyaXRlci5vbignc3RhcnRUYWcnLCAoc3RhcnRUYWcpID0+IHtcbiAgICAgIGlmIChzdGFydFRhZy50YWdOYW1lID09PSAnbm9zY3JpcHQnKSB7XG4gICAgICAgIG5lZWRzTm9TY3JpcHQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdFN0YXJ0VGFnKHN0YXJ0VGFnKTtcbiAgICB9KTtcblxuICAgIHJld3JpdGVyLm9uKCdlbmRUYWcnLCAoZW5kVGFnKSA9PiB7XG4gICAgICBpZiAoZW5kVGFnLnRhZ05hbWUgPT09ICdoZWFkJykge1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KCcgIDxsaW5rIHJlbD1cIm1hbmlmZXN0XCIgaHJlZj1cIm1hbmlmZXN0LndlYm1hbmlmZXN0XCI+XFxuJyk7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoJyAgPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMxOTc2ZDJcIj5cXG4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZW5kVGFnLnRhZ05hbWUgPT09ICdib2R5JyAmJiBuZWVkc05vU2NyaXB0KSB7XG4gICAgICAgIHJld3JpdGVyLmVtaXRSYXcoXG4gICAgICAgICAgJyAgPG5vc2NyaXB0PlBsZWFzZSBlbmFibGUgSmF2YVNjcmlwdCB0byBjb250aW51ZSB1c2luZyB0aGlzIGFwcGxpY2F0aW9uLjwvbm9zY3JpcHQ+XFxuJyxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdEVuZFRhZyhlbmRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbnB1dCA9IG5ldyBSZWFkYWJsZSh7XG4gICAgICAgIGVuY29kaW5nOiAndXRmOCcsXG4gICAgICAgIHJlYWQoKTogdm9pZCB7XG4gICAgICAgICAgdGhpcy5wdXNoKGJ1ZmZlcik7XG4gICAgICAgICAgdGhpcy5wdXNoKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNodW5rczogQXJyYXk8QnVmZmVyPiA9IFtdO1xuICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFdyaXRhYmxlKHtcbiAgICAgICAgd3JpdGUoY2h1bms6IHN0cmluZyB8IEJ1ZmZlciwgZW5jb2Rpbmc6IEJ1ZmZlckVuY29kaW5nLCBjYWxsYmFjazogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgICBjaHVua3MucHVzaCh0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnID8gQnVmZmVyLmZyb20oY2h1bmssIGVuY29kaW5nKSA6IGNodW5rKTtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbChjYWxsYmFjazogKGVycm9yPzogRXJyb3IpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgICBjb25zdCBmdWxsID0gQnVmZmVyLmNvbmNhdChjaHVua3MpO1xuICAgICAgICAgIGhvc3Qub3ZlcndyaXRlKHBhdGgsIGZ1bGwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgaW5wdXQucGlwZShyZXdyaXRlcikucGlwZShvdXRwdXQpO1xuICAgIH0pO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3QpID0+IHtcbiAgICBpZiAoIW9wdGlvbnMudGl0bGUpIHtcbiAgICAgIG9wdGlvbnMudGl0bGUgPSBvcHRpb25zLnByb2plY3Q7XG4gICAgfVxuXG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgcmVhZFdvcmtzcGFjZShob3N0KTtcblxuICAgIGlmICghb3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignT3B0aW9uIFwicHJvamVjdFwiIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5leHRlbnNpb25zWydwcm9qZWN0VHlwZSddICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUFdBIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCB0aGUgcmVsZXZhbnQgdGFyZ2V0cyBmb3IgdGhlIHByb2plY3RcbiAgICBpZiAocHJvamVjdC50YXJnZXRzLnNpemUgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBUYXJnZXRzIGFyZSBub3QgZGVmaW5lZCBmb3IgdGhpcyBwcm9qZWN0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWxkVGFyZ2V0cyA9IFtdO1xuICAgIGNvbnN0IHRlc3RUYXJnZXRzID0gW107XG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzLnZhbHVlcygpKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRhcmdldC5idWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6YnJvd3NlcicgfHxcbiAgICAgICAgdGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjphcHBsaWNhdGlvbidcbiAgICAgICkge1xuICAgICAgICBidWlsZFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQuYnVpbGRlciA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmthcm1hJykge1xuICAgICAgICB0ZXN0VGFyZ2V0cy5wdXNoKHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRkIG1hbmlmZXN0IHRvIGFzc2V0IGNvbmZpZ3VyYXRpb25cbiAgICBjb25zdCBhc3NldEVudHJ5ID0gcG9zaXguam9pbihcbiAgICAgIHByb2plY3Quc291cmNlUm9vdCA/PyBwb3NpeC5qb2luKHByb2plY3Qucm9vdCwgJ3NyYycpLFxuICAgICAgJ21hbmlmZXN0LndlYm1hbmlmZXN0JyxcbiAgICApO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIFsuLi5idWlsZFRhcmdldHMsIC4uLnRlc3RUYXJnZXRzXSkge1xuICAgICAgaWYgKHRhcmdldC5vcHRpb25zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldC5vcHRpb25zLmFzc2V0cykpIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMucHVzaChhc3NldEVudHJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXQub3B0aW9ucy5hc3NldHMgPSBbYXNzZXRFbnRyeV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldC5vcHRpb25zID0geyBhc3NldHM6IFthc3NldEVudHJ5XSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIGluZGV4Lmh0bWwgZmlsZXMgaW4gYnVpbGQgdGFyZ2V0c1xuICAgIGNvbnN0IGluZGV4RmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBidWlsZFRhcmdldHMpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0Lm9wdGlvbnM/LmluZGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbmRleEZpbGVzLmFkZCh0YXJnZXQub3B0aW9ucy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbnMgb2YgT2JqZWN0LnZhbHVlcyh0YXJnZXQuY29uZmlndXJhdGlvbnMpKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucz8uaW5kZXggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaW5kZXhGaWxlcy5hZGQob3B0aW9ucy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXR1cCBzb3VyY2VzIGZvciB0aGUgYXNzZXRzIGZpbGVzIHRvIGFkZCB0byB0aGUgcHJvamVjdFxuICAgIGNvbnN0IHNvdXJjZVBhdGggPSBwcm9qZWN0LnNvdXJjZVJvb3QgPz8gcG9zaXguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKTtcblxuICAgIC8vIFNldHVwIHNlcnZpY2Ugd29ya2VyIHNjaGVtYXRpYyBvcHRpb25zXG4gICAgY29uc3QgeyB0aXRsZSwgLi4uc3dPcHRpb25zIH0gPSBvcHRpb25zO1xuXG4gICAgYXdhaXQgd3JpdGVXb3Jrc3BhY2UoaG9zdCwgd29ya3NwYWNlKTtcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICBleHRlcm5hbFNjaGVtYXRpYygnQHNjaGVtYXRpY3MvYW5ndWxhcicsICdzZXJ2aWNlLXdvcmtlcicsIHN3T3B0aW9ucyksXG4gICAgICBtZXJnZVdpdGgoYXBwbHkodXJsKCcuL2ZpbGVzL3Jvb3QnKSwgW3RlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSwgbW92ZShzb3VyY2VQYXRoKV0pKSxcbiAgICAgIG1lcmdlV2l0aChhcHBseSh1cmwoJy4vZmlsZXMvYXNzZXRzJyksIFttb3ZlKHBvc2l4LmpvaW4oc291cmNlUGF0aCwgJ2Fzc2V0cycpKV0pKSxcbiAgICAgIC4uLlsuLi5pbmRleEZpbGVzXS5tYXAoKHBhdGgpID0+IHVwZGF0ZUluZGV4RmlsZShwYXRoKSksXG4gICAgXSk7XG4gIH07XG59XG5cbi8qKlxuICogVGhpcyB1c2VzIGEgZHluYW1pYyBpbXBvcnQgdG8gbG9hZCBhIG1vZHVsZSB3aGljaCBtYXkgYmUgRVNNLlxuICogQ29tbW9uSlMgY29kZSBjYW4gbG9hZCBFU00gY29kZSB2aWEgYSBkeW5hbWljIGltcG9ydC4gVW5mb3J0dW5hdGVseSwgVHlwZVNjcmlwdFxuICogd2lsbCBjdXJyZW50bHksIHVuY29uZGl0aW9uYWxseSBkb3dubGV2ZWwgZHluYW1pYyBpbXBvcnQgaW50byBhIHJlcXVpcmUgY2FsbC5cbiAqIHJlcXVpcmUgY2FsbHMgY2Fubm90IGxvYWQgRVNNIGNvZGUgYW5kIHdpbGwgcmVzdWx0IGluIGEgcnVudGltZSBlcnJvci4gVG8gd29ya2Fyb3VuZFxuICogdGhpcywgYSBGdW5jdGlvbiBjb25zdHJ1Y3RvciBpcyB1c2VkIHRvIHByZXZlbnQgVHlwZVNjcmlwdCBmcm9tIGNoYW5naW5nIHRoZSBkeW5hbWljIGltcG9ydC5cbiAqIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuXG4gKiBiZSBkcm9wcGVkLlxuICpcbiAqIEBwYXJhbSBtb2R1bGVQYXRoIFRoZSBwYXRoIG9mIHRoZSBtb2R1bGUgdG8gbG9hZC5cbiAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBkeW5hbWljYWxseSBpbXBvcnRlZCBtb2R1bGUuXG4gKi9cbmZ1bmN0aW9uIGxvYWRFc21Nb2R1bGU8VD4obW9kdWxlUGF0aDogc3RyaW5nIHwgVVJMKTogUHJvbWlzZTxUPiB7XG4gIHJldHVybiBuZXcgRnVuY3Rpb24oJ21vZHVsZVBhdGgnLCBgcmV0dXJuIGltcG9ydChtb2R1bGVQYXRoKTtgKShtb2R1bGVQYXRoKSBhcyBQcm9taXNlPFQ+O1xufVxuIl19