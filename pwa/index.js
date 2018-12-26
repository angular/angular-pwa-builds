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
const rxjs_1 = require("rxjs");
const stream_1 = require("stream");
const RewritingStream = require('parse5-html-rewriting-stream');
function getWorkspace(host) {
    const possibleFiles = ['/angular.json', '/.angular.json'];
    const path = possibleFiles.filter(path => host.exists(path))[0];
    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new schematics_1.SchematicsException(`Could not find (${path})`);
    }
    const content = configBuffer.toString();
    return {
        path,
        workspace: core_1.parseJson(content, core_1.JsonParseMode.Loose),
    };
}
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
        return new rxjs_1.Observable(obs => {
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
                    obs.next(host);
                    obs.complete();
                },
            });
            input.pipe(rewriter).pipe(output);
        });
    };
}
function default_1(options) {
    return (host, context) => {
        if (!options.title) {
            options.title = options.project;
        }
        const { path: workspacePath, workspace } = getWorkspace(host);
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option "project" is required.');
        }
        const project = workspace.projects[options.project];
        if (!project) {
            throw new schematics_1.SchematicsException(`Project is not defined in this workspace.`);
        }
        if (project.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`PWA requires a project type of "application".`);
        }
        // Find all the relevant targets for the project
        const projectTargets = project.targets || project.architect;
        if (!projectTargets || Object.keys(projectTargets).length === 0) {
            throw new schematics_1.SchematicsException(`Targets are not defined for this project.`);
        }
        const buildTargets = [];
        const testTargets = [];
        for (const targetName in projectTargets) {
            const target = projectTargets[targetName];
            if (!target) {
                continue;
            }
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
                if (target.options.assets) {
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
        host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
        // Find all index.html files in build targets
        const indexFiles = new Set();
        for (const target of buildTargets) {
            if (target.options && target.options.index) {
                indexFiles.add(target.options.index);
            }
            if (!target.configurations) {
                continue;
            }
            for (const configName in target.configurations) {
                const configuration = target.configurations[configName];
                if (configuration && configuration.index) {
                    indexFiles.add(configuration.index);
                }
            }
        }
        // Setup sources for the assets files to add to the project
        const sourcePath = core_1.join(core_1.normalize(project.root), 'src');
        const assetsPath = core_1.join(sourcePath, 'assets');
        const rootTemplateSource = schematics_1.apply(schematics_1.url('./files/root'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(core_1.getSystemPath(sourcePath)),
        ]);
        const assetsTemplateSource = schematics_1.apply(schematics_1.url('./files/assets'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(core_1.getSystemPath(assetsPath)),
        ]);
        // Setup service worker schematic options
        const swOptions = Object.assign({}, options);
        delete swOptions.title;
        // Chain the rules and return
        return schematics_1.chain([
            schematics_1.externalSchematic('@schematics/angular', 'service-worker', swOptions),
            schematics_1.mergeWith(rootTemplateSource),
            schematics_1.mergeWith(assetsTemplateSource),
            ...[...indexFiles].map(path => updateIndexFile(path)),
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQU84QjtBQUM5QiwyREFZb0M7QUFDcEMsK0JBQWtDO0FBQ2xDLG1DQUE0QztBQUc1QyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUdoRSxTQUFTLFlBQVksQ0FDbkIsSUFBVTtJQUVWLE1BQU0sYUFBYSxHQUFHLENBQUUsZUFBZSxFQUFFLGdCQUFnQixDQUFFLENBQUM7SUFDNUQsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVoRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN6QixNQUFNLElBQUksZ0NBQW1CLENBQUMsbUJBQW1CLElBQUksR0FBRyxDQUFDLENBQUM7S0FDM0Q7SUFDRCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFeEMsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTLEVBQUUsZ0JBQVMsQ0FDbEIsT0FBTyxFQUNQLG9CQUFhLENBQUMsS0FBSyxDQUM0QjtLQUNsRCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLElBQVk7SUFDbkMsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyw4QkFB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QUMsQ0FBQztBQUNKLENBQUM7QUFsR0QsNEJBa0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtcbiAgSnNvblBhcnNlTW9kZSxcbiAgZXhwZXJpbWVudGFsLFxuICBnZXRTeXN0ZW1QYXRoLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHBhcnNlSnNvbixcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGNoYWluLFxuICBleHRlcm5hbFNjaGVtYXRpYyxcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBSZWFkYWJsZSwgV3JpdGFibGUgfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFB3YU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmNvbnN0IFJld3JpdGluZ1N0cmVhbSA9IHJlcXVpcmUoJ3BhcnNlNS1odG1sLXJld3JpdGluZy1zdHJlYW0nKTtcblxuXG5mdW5jdGlvbiBnZXRXb3Jrc3BhY2UoXG4gIGhvc3Q6IFRyZWUsXG4pOiB7IHBhdGg6IHN0cmluZywgd29ya3NwYWNlOiBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZVNjaGVtYSB9IHtcbiAgY29uc3QgcG9zc2libGVGaWxlcyA9IFsgJy9hbmd1bGFyLmpzb24nLCAnLy5hbmd1bGFyLmpzb24nIF07XG4gIGNvbnN0IHBhdGggPSBwb3NzaWJsZUZpbGVzLmZpbHRlcihwYXRoID0+IGhvc3QuZXhpc3RzKHBhdGgpKVswXTtcblxuICBjb25zdCBjb25maWdCdWZmZXIgPSBob3N0LnJlYWQocGF0aCk7XG4gIGlmIChjb25maWdCdWZmZXIgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IGZpbmQgKCR7cGF0aH0pYCk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IGNvbmZpZ0J1ZmZlci50b1N0cmluZygpO1xuXG4gIHJldHVybiB7XG4gICAgcGF0aCxcbiAgICB3b3Jrc3BhY2U6IHBhcnNlSnNvbihcbiAgICAgIGNvbnRlbnQsXG4gICAgICBKc29uUGFyc2VNb2RlLkxvb3NlLFxuICAgICkgYXMge30gYXMgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2VTY2hlbWEsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUluZGV4RmlsZShwYXRoOiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlKSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBpbmRleCBmaWxlOiAke3BhdGh9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmV3cml0ZXIgPSBuZXcgUmV3cml0aW5nU3RyZWFtKCk7XG5cbiAgICBsZXQgbmVlZHNOb1NjcmlwdCA9IHRydWU7XG4gICAgcmV3cml0ZXIub24oJ3N0YXJ0VGFnJywgKHN0YXJ0VGFnOiB7IHRhZ05hbWU6IHN0cmluZyB9KSA9PiB7XG4gICAgICBpZiAoc3RhcnRUYWcudGFnTmFtZSA9PT0gJ25vc2NyaXB0Jykge1xuICAgICAgICBuZWVkc05vU2NyaXB0ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyhzdGFydFRhZyk7XG4gICAgfSk7XG5cbiAgICByZXdyaXRlci5vbignZW5kVGFnJywgKGVuZFRhZzogeyB0YWdOYW1lOiBzdHJpbmcgfSkgPT4ge1xuICAgICAgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnaGVhZCcpIHtcbiAgICAgICAgcmV3cml0ZXIuZW1pdFJhdygnICA8bGluayByZWw9XCJtYW5pZmVzdFwiIGhyZWY9XCJtYW5pZmVzdC53ZWJtYW5pZmVzdFwiPlxcbicpO1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KCcgIDxtZXRhIG5hbWU9XCJ0aGVtZS1jb2xvclwiIGNvbnRlbnQ9XCIjMTk3NmQyXCI+XFxuJyk7XG4gICAgICB9IGVsc2UgaWYgKGVuZFRhZy50YWdOYW1lID09PSAnYm9keScgJiYgbmVlZHNOb1NjcmlwdCkge1xuICAgICAgICByZXdyaXRlci5lbWl0UmF3KFxuICAgICAgICAgICcgIDxub3NjcmlwdD5QbGVhc2UgZW5hYmxlIEphdmFTY3JpcHQgdG8gY29udGludWUgdXNpbmcgdGhpcyBhcHBsaWNhdGlvbi48L25vc2NyaXB0PlxcbicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRFbmRUYWcoZW5kVGFnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxUcmVlPihvYnMgPT4ge1xuICAgICAgY29uc3QgaW5wdXQgPSBuZXcgUmVhZGFibGUoe1xuICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICByZWFkKCk6IHZvaWQge1xuICAgICAgICAgIHRoaXMucHVzaChidWZmZXIpO1xuICAgICAgICAgIHRoaXMucHVzaChudWxsKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaHVua3M6IEFycmF5PEJ1ZmZlcj4gPSBbXTtcbiAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBXcml0YWJsZSh7XG4gICAgICAgIHdyaXRlKGNodW5rOiBzdHJpbmcgfCBCdWZmZXIsIGVuY29kaW5nOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICAgIGNodW5rcy5wdXNoKHR5cGVvZiBjaHVuayA9PT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjaHVuaywgZW5jb2RpbmcpIDogY2h1bmspO1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKGNhbGxiYWNrOiAoZXJyb3I/OiBFcnJvcikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgIGNvbnN0IGZ1bGwgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG4gICAgICAgICAgaG9zdC5vdmVyd3JpdGUocGF0aCwgZnVsbC50b1N0cmluZygpKTtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIG9icy5uZXh0KGhvc3QpO1xuICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGlucHV0LnBpcGUocmV3cml0ZXIpLnBpcGUob3V0cHV0KTtcbiAgICB9KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgaWYgKCFvcHRpb25zLnRpdGxlKSB7XG4gICAgICBvcHRpb25zLnRpdGxlID0gb3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cbiAgICBjb25zdCB7cGF0aDogd29ya3NwYWNlUGF0aCwgd29ya3NwYWNlIH0gPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzW29wdGlvbnMucHJvamVjdF07XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5wcm9qZWN0VHlwZSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFBXQSByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIuYCk7XG4gICAgfVxuXG4gICAgLy8gRmluZCBhbGwgdGhlIHJlbGV2YW50IHRhcmdldHMgZm9yIHRoZSBwcm9qZWN0XG4gICAgY29uc3QgcHJvamVjdFRhcmdldHMgPSBwcm9qZWN0LnRhcmdldHMgfHwgcHJvamVjdC5hcmNoaXRlY3Q7XG4gICAgaWYgKCFwcm9qZWN0VGFyZ2V0cyB8fCBPYmplY3Qua2V5cyhwcm9qZWN0VGFyZ2V0cykubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgVGFyZ2V0cyBhcmUgbm90IGRlZmluZWQgZm9yIHRoaXMgcHJvamVjdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsZFRhcmdldHMgPSBbXTtcbiAgICBjb25zdCB0ZXN0VGFyZ2V0cyA9IFtdO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0TmFtZSBpbiBwcm9qZWN0VGFyZ2V0cykge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gcHJvamVjdFRhcmdldHNbdGFyZ2V0TmFtZV07XG4gICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldC5idWlsZGVyID09PSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXI6YnJvd3NlcicpIHtcbiAgICAgICAgYnVpbGRUYXJnZXRzLnB1c2godGFyZ2V0KTtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmJ1aWxkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjprYXJtYScpIHtcbiAgICAgICAgdGVzdFRhcmdldHMucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBtYW5pZmVzdCB0byBhc3NldCBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgYXNzZXRFbnRyeSA9IGpvaW4obm9ybWFsaXplKHByb2plY3Qucm9vdCksICdzcmMnLCAnbWFuaWZlc3Qud2VibWFuaWZlc3QnKTtcbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBbLi4uYnVpbGRUYXJnZXRzLCAuLi50ZXN0VGFyZ2V0c10pIHtcbiAgICAgIGlmICh0YXJnZXQub3B0aW9ucykge1xuICAgICAgICBpZiAodGFyZ2V0Lm9wdGlvbnMuYXNzZXRzKSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzLnB1c2goYXNzZXRFbnRyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFyZ2V0Lm9wdGlvbnMuYXNzZXRzID0gWyBhc3NldEVudHJ5IF07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldC5vcHRpb25zID0geyBhc3NldHM6IFsgYXNzZXRFbnRyeSBdIH07XG4gICAgICB9XG4gICAgfVxuICAgIGhvc3Qub3ZlcndyaXRlKHdvcmtzcGFjZVBhdGgsIEpTT04uc3RyaW5naWZ5KHdvcmtzcGFjZSwgbnVsbCwgMikpO1xuXG4gICAgLy8gRmluZCBhbGwgaW5kZXguaHRtbCBmaWxlcyBpbiBidWlsZCB0YXJnZXRzXG4gICAgY29uc3QgaW5kZXhGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIGJ1aWxkVGFyZ2V0cykge1xuICAgICAgaWYgKHRhcmdldC5vcHRpb25zICYmIHRhcmdldC5vcHRpb25zLmluZGV4KSB7XG4gICAgICAgIGluZGV4RmlsZXMuYWRkKHRhcmdldC5vcHRpb25zLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0YXJnZXQuY29uZmlndXJhdGlvbnMpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGNvbmZpZ05hbWUgaW4gdGFyZ2V0LmNvbmZpZ3VyYXRpb25zKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb24gPSB0YXJnZXQuY29uZmlndXJhdGlvbnNbY29uZmlnTmFtZV07XG4gICAgICAgIGlmIChjb25maWd1cmF0aW9uICYmIGNvbmZpZ3VyYXRpb24uaW5kZXgpIHtcbiAgICAgICAgICBpbmRleEZpbGVzLmFkZChjb25maWd1cmF0aW9uLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHVwIHNvdXJjZXMgZm9yIHRoZSBhc3NldHMgZmlsZXMgdG8gYWRkIHRvIHRoZSBwcm9qZWN0XG4gICAgY29uc3Qgc291cmNlUGF0aCA9IGpvaW4obm9ybWFsaXplKHByb2plY3Qucm9vdCksICdzcmMnKTtcbiAgICBjb25zdCBhc3NldHNQYXRoID0gam9pbihzb3VyY2VQYXRoLCAnYXNzZXRzJyk7XG4gICAgY29uc3Qgcm9vdFRlbXBsYXRlU291cmNlID0gYXBwbHkodXJsKCcuL2ZpbGVzL3Jvb3QnKSwgW1xuICAgICAgdGVtcGxhdGUoeyAuLi5vcHRpb25zIH0pLFxuICAgICAgbW92ZShnZXRTeXN0ZW1QYXRoKHNvdXJjZVBhdGgpKSxcbiAgICBdKTtcbiAgICBjb25zdCBhc3NldHNUZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW1xuICAgICAgdGVtcGxhdGUoeyAuLi5vcHRpb25zIH0pLFxuICAgICAgbW92ZShnZXRTeXN0ZW1QYXRoKGFzc2V0c1BhdGgpKSxcbiAgICBdKTtcblxuICAgIC8vIFNldHVwIHNlcnZpY2Ugd29ya2VyIHNjaGVtYXRpYyBvcHRpb25zXG4gICAgY29uc3Qgc3dPcHRpb25zID0geyAuLi5vcHRpb25zIH07XG4gICAgZGVsZXRlIHN3T3B0aW9ucy50aXRsZTtcblxuICAgIC8vIENoYWluIHRoZSBydWxlcyBhbmQgcmV0dXJuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIGV4dGVybmFsU2NoZW1hdGljKCdAc2NoZW1hdGljcy9hbmd1bGFyJywgJ3NlcnZpY2Utd29ya2VyJywgc3dPcHRpb25zKSxcbiAgICAgIG1lcmdlV2l0aChyb290VGVtcGxhdGVTb3VyY2UpLFxuICAgICAgbWVyZ2VXaXRoKGFzc2V0c1RlbXBsYXRlU291cmNlKSxcbiAgICAgIC4uLlsuLi5pbmRleEZpbGVzXS5tYXAocGF0aCA9PiB1cGRhdGVJbmRleEZpbGUocGF0aCkpLFxuICAgIF0pKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuIl19