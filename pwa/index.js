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
const config_1 = require("../utility/config");
function addServiceWorker(options) {
    return (host, context) => {
        context.logger.debug('Adding service worker...');
        const swOptions = Object.assign({}, options);
        delete swOptions.title;
        return schematics_1.externalSchematic('@schematics/angular', 'service-worker', swOptions);
    };
}
function getIndent(text) {
    let indent = '';
    for (const char of text) {
        if (char === ' ' || char === '\t') {
            indent += char;
        }
        else {
            break;
        }
    }
    return indent;
}
function updateIndexFile(options) {
    return (host, context) => {
        const workspace = config_1.getWorkspace(host);
        const project = workspace.projects[options.project];
        let path;
        const projectTargets = project.targets || project.architect;
        if (project && projectTargets && projectTargets.build && projectTargets.build.options.index) {
            path = projectTargets.build.options.index;
        }
        else {
            throw new schematics_1.SchematicsException('Could not find index file for the project');
        }
        const buffer = host.read(path);
        if (buffer === null) {
            throw new schematics_1.SchematicsException(`Could not read index file: ${path}`);
        }
        const content = buffer.toString();
        const lines = content.split('\n');
        let closingHeadTagLineIndex = -1;
        let closingBodyTagLineIndex = -1;
        lines.forEach((line, index) => {
            if (closingHeadTagLineIndex === -1 && /<\/head>/.test(line)) {
                closingHeadTagLineIndex = index;
            }
            else if (closingBodyTagLineIndex === -1 && /<\/body>/.test(line)) {
                closingBodyTagLineIndex = index;
            }
        });
        const headIndent = getIndent(lines[closingHeadTagLineIndex]) + '  ';
        const itemsToAddToHead = [
            '<link rel="manifest" href="manifest.json">',
            '<meta name="theme-color" content="#1976d2">',
        ];
        const bodyIndent = getIndent(lines[closingBodyTagLineIndex]) + '  ';
        const itemsToAddToBody = [
            '<noscript>Please enable JavaScript to continue using this application.</noscript>',
        ];
        const updatedIndex = [
            ...lines.slice(0, closingHeadTagLineIndex),
            ...itemsToAddToHead.map(line => headIndent + line),
            ...lines.slice(closingHeadTagLineIndex, closingBodyTagLineIndex),
            ...itemsToAddToBody.map(line => bodyIndent + line),
            ...lines.slice(closingBodyTagLineIndex),
        ].join('\n');
        host.overwrite(path, updatedIndex);
        return host;
    };
}
function addManifestToAssetsConfig(options) {
    return (host, context) => {
        const workspacePath = config_1.getWorkspacePath(host);
        const workspace = config_1.getWorkspace(host);
        const project = workspace.projects[options.project];
        if (!project) {
            throw new Error(`Project is not defined in this workspace.`);
        }
        const assetEntry = core_1.join(core_1.normalize(project.root), 'src', 'manifest.json');
        const projectTargets = project.targets || project.architect;
        if (!projectTargets) {
            throw new Error(`Targets are not defined for this project.`);
        }
        ['build', 'test'].forEach((target) => {
            const applyTo = projectTargets[target].options;
            const assets = applyTo.assets || (applyTo.assets = []);
            assets.push(assetEntry);
        });
        host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
        return host;
    };
}
function default_1(options) {
    return (host, context) => {
        const workspace = config_1.getWorkspace(host);
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option "project" is required.');
        }
        const project = workspace.projects[options.project];
        if (project.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`PWA requires a project type of "application".`);
        }
        const sourcePath = core_1.join(project.root, 'src');
        const assetsPath = core_1.join(sourcePath, 'assets');
        options.title = options.title || options.project;
        const rootTemplateSource = schematics_1.apply(schematics_1.url('./files/root'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(sourcePath),
        ]);
        const assetsTemplateSource = schematics_1.apply(schematics_1.url('./files/assets'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(assetsPath),
        ]);
        return schematics_1.chain([
            addServiceWorker(options),
            schematics_1.mergeWith(rootTemplateSource),
            schematics_1.mergeWith(assetsTemplateSource),
            updateIndexFile(options),
            addManifestToAssetsConfig(options),
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQUE2RDtBQUM3RCwyREFZb0M7QUFDcEMsOENBQW1FO0FBSW5FLDBCQUEwQixPQUFtQjtJQUMzQyxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUMvQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBRWpELE1BQU0sU0FBUyxxQkFDVixPQUFPLENBQ1gsQ0FBQztRQUNGLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztRQUV2QixPQUFPLDhCQUFpQixDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQy9FLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxtQkFBbUIsSUFBWTtJQUM3QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFFaEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7UUFDdkIsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDakMsTUFBTSxJQUFJLElBQUksQ0FBQztTQUNoQjthQUFNO1lBQ0wsTUFBTTtTQUNQO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQseUJBQXlCLE9BQW1CO0lBQzFDLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE1BQU0sU0FBUyxHQUFHLHFCQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBaUIsQ0FBQyxDQUFDO1FBQzlELElBQUksSUFBWSxDQUFDO1FBQ2pCLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElB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QUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxhQUFhLEVBQUU7WUFDekMsTUFBTSxJQUFJLGdDQUFtQixDQUFDLCtDQUErQyxDQUFDLENBQUM7U0FDaEY7UUFFRCxNQUFNLFVBQVUsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLElBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBRyxXQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDO1FBRWpELE1BQU0sa0JBQWtCLEdBQUcsa0JBQUssQ0FBQyxnQkFBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ3BELHFCQUFRLG1CQUFNLE9BQU8sRUFBRztZQUN4QixpQkFBSSxDQUFDLFVBQVUsQ0FBQztTQUNqQixDQUFDLENBQUM7UUFDSCxNQUFNLG9CQUFvQixHQUFHLGtCQUFLLENBQUMsZ0JBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1lBQ3hELHFCQUFRLG1CQUFNLE9BQU8sRUFBRztZQUN4QixpQkFBSSxDQUFDLFVBQVUsQ0FBQztTQUNqQixDQUFDLENBQUM7UUFFSCxPQUFPLGtCQUFLLENBQUM7WUFDWCxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7WUFDekIsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQztZQUM3QixzQkFBUyxDQUFDLG9CQUFvQixDQUFDO1lBQy9CLGVBQWUsQ0FBQyxPQUFPLENBQUM7WUFDeEIseUJBQXlCLENBQUMsT0FBTyxDQUFDO1NBQ25DLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpDRCw0QkFpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQgeyBQYXRoLCBqb2luLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNDb250ZXh0LFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxuICBUcmVlLFxuICBhcHBseSxcbiAgY2hhaW4sXG4gIGV4dGVybmFsU2NoZW1hdGljLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIHRlbXBsYXRlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZSwgZ2V0V29ya3NwYWNlUGF0aCB9IGZyb20gJy4uL3V0aWxpdHkvY29uZmlnJztcbmltcG9ydCB7IFNjaGVtYSBhcyBQd2FPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5cbmZ1bmN0aW9uIGFkZFNlcnZpY2VXb3JrZXIob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LmxvZ2dlci5kZWJ1ZygnQWRkaW5nIHNlcnZpY2Ugd29ya2VyLi4uJyk7XG5cbiAgICBjb25zdCBzd09wdGlvbnMgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG4gICAgZGVsZXRlIHN3T3B0aW9ucy50aXRsZTtcblxuICAgIHJldHVybiBleHRlcm5hbFNjaGVtYXRpYygnQHNjaGVtYXRpY3MvYW5ndWxhcicsICdzZXJ2aWNlLXdvcmtlcicsIHN3T3B0aW9ucyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldEluZGVudCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgaW5kZW50ID0gJyc7XG5cbiAgZm9yIChjb25zdCBjaGFyIG9mIHRleHQpIHtcbiAgICBpZiAoY2hhciA9PT0gJyAnIHx8IGNoYXIgPT09ICdcXHQnKSB7XG4gICAgICBpbmRlbnQgKz0gY2hhcjtcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGluZGVudDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW5kZXhGaWxlKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0IGFzIHN0cmluZ107XG4gICAgbGV0IHBhdGg6IHN0cmluZztcbiAgICBjb25zdCBwcm9qZWN0VGFyZ2V0cyA9IHByb2plY3QudGFyZ2V0cyB8fCBwcm9qZWN0LmFyY2hpdGVjdDtcbiAgICBpZiAocHJvamVjdCAmJiBwcm9qZWN0VGFyZ2V0cyAmJiBwcm9qZWN0VGFyZ2V0cy5idWlsZCAmJiBwcm9qZWN0VGFyZ2V0cy5idWlsZC5vcHRpb25zLmluZGV4KSB7XG4gICAgICBwYXRoID0gcHJvamVjdFRhcmdldHMuYnVpbGQub3B0aW9ucy5pbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGluZGV4IGZpbGUgZm9yIHRoZSBwcm9qZWN0Jyk7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZChwYXRoKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgaW5kZXggZmlsZTogJHtwYXRofWApO1xuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICBsZXQgY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXggPSAtMTtcbiAgICBsZXQgY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXggPSAtMTtcbiAgICBsaW5lcy5mb3JFYWNoKChsaW5lLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKGNsb3NpbmdIZWFkVGFnTGluZUluZGV4ID09PSAtMSAmJiAvPFxcL2hlYWQ+Ly50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGNsb3NpbmdIZWFkVGFnTGluZUluZGV4ID0gaW5kZXg7XG4gICAgICB9IGVsc2UgaWYgKGNsb3NpbmdCb2R5VGFnTGluZUluZGV4ID09PSAtMSAmJiAvPFxcL2JvZHk+Ly50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGNsb3NpbmdCb2R5VGFnTGluZUluZGV4ID0gaW5kZXg7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWFkSW5kZW50ID0gZ2V0SW5kZW50KGxpbmVzW2Nsb3NpbmdIZWFkVGFnTGluZUluZGV4XSkgKyAnICAnO1xuICAgIGNvbnN0IGl0ZW1zVG9BZGRUb0hlYWQgPSBbXG4gICAgICAnPGxpbmsgcmVsPVwibWFuaWZlc3RcIiBocmVmPVwibWFuaWZlc3QuanNvblwiPicsXG4gICAgICAnPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMxOTc2ZDJcIj4nLFxuICAgIF07XG5cbiAgICBjb25zdCBib2R5SW5kZW50ID0gZ2V0SW5kZW50KGxpbmVzW2Nsb3NpbmdCb2R5VGFnTGluZUluZGV4XSkgKyAnICAnO1xuICAgIGNvbnN0IGl0ZW1zVG9BZGRUb0JvZHkgPSBbXG4gICAgICAnPG5vc2NyaXB0PlBsZWFzZSBlbmFibGUgSmF2YVNjcmlwdCB0byBjb250aW51ZSB1c2luZyB0aGlzIGFwcGxpY2F0aW9uLjwvbm9zY3JpcHQ+JyxcbiAgICBdO1xuXG4gICAgY29uc3QgdXBkYXRlZEluZGV4ID0gW1xuICAgICAgLi4ubGluZXMuc2xpY2UoMCwgY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXgpLFxuICAgICAgLi4uaXRlbXNUb0FkZFRvSGVhZC5tYXAobGluZSA9PiBoZWFkSW5kZW50ICsgbGluZSksXG4gICAgICAuLi5saW5lcy5zbGljZShjbG9zaW5nSGVhZFRhZ0xpbmVJbmRleCwgY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXgpLFxuICAgICAgLi4uaXRlbXNUb0FkZFRvQm9keS5tYXAobGluZSA9PiBib2R5SW5kZW50ICsgbGluZSksXG4gICAgICAuLi5saW5lcy5zbGljZShjbG9zaW5nQm9keVRhZ0xpbmVJbmRleCksXG4gICAgXS5qb2luKCdcXG4nKTtcblxuICAgIGhvc3Qub3ZlcndyaXRlKHBhdGgsIHVwZGF0ZWRJbmRleCk7XG5cbiAgICByZXR1cm4gaG9zdDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkTWFuaWZlc3RUb0Fzc2V0c0NvbmZpZyhvcHRpb25zOiBQd2FPcHRpb25zKSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuXG4gICAgY29uc3Qgd29ya3NwYWNlUGF0aCA9IGdldFdvcmtzcGFjZVBhdGgoaG9zdCk7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0IGFzIHN0cmluZ107XG5cbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvamVjdCBpcyBub3QgZGVmaW5lZCBpbiB0aGlzIHdvcmtzcGFjZS5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldEVudHJ5ID0gam9pbihub3JtYWxpemUocHJvamVjdC5yb290KSwgJ3NyYycsICdtYW5pZmVzdC5qc29uJyk7XG5cbiAgICBjb25zdCBwcm9qZWN0VGFyZ2V0cyA9IHByb2plY3QudGFyZ2V0cyB8fCBwcm9qZWN0LmFyY2hpdGVjdDtcbiAgICBpZiAoIXByb2plY3RUYXJnZXRzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRhcmdldHMgYXJlIG5vdCBkZWZpbmVkIGZvciB0aGlzIHByb2plY3QuYCk7XG4gICAgfVxuXG4gICAgWydidWlsZCcsICd0ZXN0J10uZm9yRWFjaCgodGFyZ2V0KSA9PiB7XG5cbiAgICAgIGNvbnN0IGFwcGx5VG8gPSBwcm9qZWN0VGFyZ2V0c1t0YXJnZXRdLm9wdGlvbnM7XG4gICAgICBjb25zdCBhc3NldHMgPSBhcHBseVRvLmFzc2V0cyB8fCAoYXBwbHlUby5hc3NldHMgPSBbXSk7XG5cbiAgICAgIGFzc2V0cy5wdXNoKGFzc2V0RW50cnkpO1xuXG4gICAgfSk7XG5cbiAgICBob3N0Lm92ZXJ3cml0ZSh3b3Jrc3BhY2VQYXRoLCBKU09OLnN0cmluZ2lmeSh3b3Jrc3BhY2UsIG51bGwsIDIpKTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgaWYgKCFvcHRpb25zLnByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdPcHRpb24gXCJwcm9qZWN0XCIgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0XTtcbiAgICBpZiAocHJvamVjdC5wcm9qZWN0VHlwZSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFBXQSByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlUGF0aCA9IGpvaW4ocHJvamVjdC5yb290IGFzIFBhdGgsICdzcmMnKTtcbiAgICBjb25zdCBhc3NldHNQYXRoID0gam9pbihzb3VyY2VQYXRoLCAnYXNzZXRzJyk7XG5cbiAgICBvcHRpb25zLnRpdGxlID0gb3B0aW9ucy50aXRsZSB8fCBvcHRpb25zLnByb2plY3Q7XG5cbiAgICBjb25zdCByb290VGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMvcm9vdCcpLCBbXG4gICAgICB0ZW1wbGF0ZSh7IC4uLm9wdGlvbnMgfSksXG4gICAgICBtb3ZlKHNvdXJjZVBhdGgpLFxuICAgIF0pO1xuICAgIGNvbnN0IGFzc2V0c1RlbXBsYXRlU291cmNlID0gYXBwbHkodXJsKCcuL2ZpbGVzL2Fzc2V0cycpLCBbXG4gICAgICB0ZW1wbGF0ZSh7IC4uLm9wdGlvbnMgfSksXG4gICAgICBtb3ZlKGFzc2V0c1BhdGgpLFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIGFkZFNlcnZpY2VXb3JrZXIob3B0aW9ucyksXG4gICAgICBtZXJnZVdpdGgocm9vdFRlbXBsYXRlU291cmNlKSxcbiAgICAgIG1lcmdlV2l0aChhc3NldHNUZW1wbGF0ZVNvdXJjZSksXG4gICAgICB1cGRhdGVJbmRleEZpbGUob3B0aW9ucyksXG4gICAgICBhZGRNYW5pZmVzdFRvQXNzZXRzQ29uZmlnKG9wdGlvbnMpLFxuICAgIF0pKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuIl19