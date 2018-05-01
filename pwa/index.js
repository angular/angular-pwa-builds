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
        return schematics_1.externalSchematic('@schematics/angular', 'service-worker', options)(host, context);
    };
}
function getIndent(text) {
    let indent = '';
    let hitNonSpace = false;
    text.split('')
        .forEach(char => {
        if (char === ' ' && !hitNonSpace) {
            indent += ' ';
        }
        else {
            hitNonSpace = true;
        }
    }, 0);
    return indent;
}
function updateIndexFile(options) {
    return (host, context) => {
        const workspace = config_1.getWorkspace(host);
        const project = workspace.projects[options.project];
        let path;
        if (project && project.architect && project.architect.build &&
            project.architect.build.options.index) {
            path = project.architect.build.options.index;
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
        let closingHeadTagLine = '';
        lines.forEach((line, index) => {
            if (/<\/head>/.test(line) && closingHeadTagLineIndex === -1) {
                closingHeadTagLine = line;
                closingHeadTagLineIndex = index;
            }
        });
        const indent = getIndent(closingHeadTagLine) + '  ';
        const itemsToAdd = [
            '<link rel="manifest" href="manifest.json">',
            '<meta name="theme-color" content="#1976d2">',
        ];
        const textToInsert = itemsToAdd
            .map(text => indent + text)
            .join('\n');
        const updatedIndex = [
            ...lines.slice(0, closingHeadTagLineIndex),
            textToInsert,
            ...lines.slice(closingHeadTagLineIndex),
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
        if (!project.architect) {
            throw new Error(`Architect is not defined for this project.`);
        }
        const architect = project.architect;
        ['build', 'test'].forEach((target) => {
            const applyTo = architect[target].options;
            if (!applyTo.assets) {
                applyTo.assets = [assetEntry];
            }
            else {
                applyTo.assets.push(assetEntry);
            }
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
        const assetPath = core_1.join(project.root, 'src', 'assets');
        const sourcePath = core_1.join(project.root, 'src');
        options.title = options.title || options.project;
        const templateSource = schematics_1.apply(schematics_1.url('./files/assets'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(assetPath),
        ]);
        return schematics_1.chain([
            addServiceWorker(options),
            schematics_1.branchAndMerge(schematics_1.chain([
                schematics_1.mergeWith(templateSource),
            ])),
            schematics_1.mergeWith(schematics_1.apply(schematics_1.url('./files/root'), [
                schematics_1.template(Object.assign({}, options)),
                schematics_1.move(sourcePath),
            ])),
            updateIndexFile(options),
            addManifestToAssetsConfig(options),
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQUE2RDtBQUM3RCwyREFhb0M7QUFDcEMsOENBQW1FO0FBSW5FLDBCQUEwQixPQUFtQjtJQUMzQyxNQUFNLENBQUMsQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFFakQsTUFBTSxDQUFDLDhCQUFpQixDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsbUJBQW1CLElBQVk7SUFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztTQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNkLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDaEIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sV0FBVyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO0lBQ0gsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRVIsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQseUJBQXlCLE9BQW1CO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsTUFBTSxTQUFTLEdBQUcscUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxN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QztBQUNKLENBQUM7QUFwQ0QsNEJBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHsgUGF0aCwgam9pbiwgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgZXh0ZXJuYWxTY2hlbWF0aWMsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgdGVtcGxhdGUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgZ2V0V29ya3NwYWNlLCBnZXRXb3Jrc3BhY2VQYXRoIH0gZnJvbSAnLi4vdXRpbGl0eS9jb25maWcnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFB3YU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cblxuZnVuY3Rpb24gYWRkU2VydmljZVdvcmtlcihvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnRleHQubG9nZ2VyLmRlYnVnKCdBZGRpbmcgc2VydmljZSB3b3JrZXIuLi4nKTtcblxuICAgIHJldHVybiBleHRlcm5hbFNjaGVtYXRpYygnQHNjaGVtYXRpY3MvYW5ndWxhcicsICdzZXJ2aWNlLXdvcmtlcicsIG9wdGlvbnMpKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRJbmRlbnQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGluZGVudCA9ICcnO1xuICBsZXQgaGl0Tm9uU3BhY2UgPSBmYWxzZTtcbiAgdGV4dC5zcGxpdCgnJylcbiAgICAuZm9yRWFjaChjaGFyID0+IHtcbiAgICAgIGlmIChjaGFyID09PSAnICcgJiYgIWhpdE5vblNwYWNlKSB7XG4gICAgICAgIGluZGVudCArPSAnICc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaXROb25TcGFjZSA9IHRydWU7XG4gICAgICB9XG4gICAgfSwgMCk7XG5cbiAgcmV0dXJuIGluZGVudDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlSW5kZXhGaWxlKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0IGFzIHN0cmluZ107XG4gICAgbGV0IHBhdGg6IHN0cmluZztcbiAgICBpZiAocHJvamVjdCAmJiBwcm9qZWN0LmFyY2hpdGVjdCAmJiBwcm9qZWN0LmFyY2hpdGVjdC5idWlsZCAmJlxuICAgICAgICBwcm9qZWN0LmFyY2hpdGVjdC5idWlsZC5vcHRpb25zLmluZGV4KSB7XG4gICAgICBwYXRoID0gcHJvamVjdC5hcmNoaXRlY3QuYnVpbGQub3B0aW9ucy5pbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGluZGV4IGZpbGUgZm9yIHRoZSBwcm9qZWN0Jyk7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZmZlciA9IGhvc3QucmVhZChwYXRoKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IHJlYWQgaW5kZXggZmlsZTogJHtwYXRofWApO1xuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICBsZXQgY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXggPSAtMTtcbiAgICBsZXQgY2xvc2luZ0hlYWRUYWdMaW5lID0gJyc7XG4gICAgbGluZXMuZm9yRWFjaCgobGluZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmICgvPFxcL2hlYWQ+Ly50ZXN0KGxpbmUpICYmIGNsb3NpbmdIZWFkVGFnTGluZUluZGV4ID09PSAtMSkge1xuICAgICAgICBjbG9zaW5nSGVhZFRhZ0xpbmUgPSBsaW5lO1xuICAgICAgICBjbG9zaW5nSGVhZFRhZ0xpbmVJbmRleCA9IGluZGV4O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5kZW50ID0gZ2V0SW5kZW50KGNsb3NpbmdIZWFkVGFnTGluZSkgKyAnICAnO1xuICAgIGNvbnN0IGl0ZW1zVG9BZGQgPSBbXG4gICAgICAnPGxpbmsgcmVsPVwibWFuaWZlc3RcIiBocmVmPVwibWFuaWZlc3QuanNvblwiPicsXG4gICAgICAnPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMxOTc2ZDJcIj4nLFxuICAgIF07XG5cbiAgICBjb25zdCB0ZXh0VG9JbnNlcnQgPSBpdGVtc1RvQWRkXG4gICAgICAubWFwKHRleHQgPT4gaW5kZW50ICsgdGV4dClcbiAgICAgIC5qb2luKCdcXG4nKTtcblxuICAgIGNvbnN0IHVwZGF0ZWRJbmRleCA9IFtcbiAgICAgIC4uLmxpbmVzLnNsaWNlKDAsIGNsb3NpbmdIZWFkVGFnTGluZUluZGV4KSxcbiAgICAgIHRleHRUb0luc2VydCxcbiAgICAgIC4uLmxpbmVzLnNsaWNlKGNsb3NpbmdIZWFkVGFnTGluZUluZGV4KSxcbiAgICBdLmpvaW4oJ1xcbicpO1xuXG4gICAgaG9zdC5vdmVyd3JpdGUocGF0aCwgdXBkYXRlZEluZGV4KTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRNYW5pZmVzdFRvQXNzZXRzQ29uZmlnKG9wdGlvbnM6IFB3YU9wdGlvbnMpIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG5cbiAgICBjb25zdCB3b3Jrc3BhY2VQYXRoID0gZ2V0V29ya3NwYWNlUGF0aChob3N0KTtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3QgYXMgc3RyaW5nXTtcblxuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm9qZWN0IGlzIG5vdCBkZWZpbmVkIGluIHRoaXMgd29ya3NwYWNlLmApO1xuICAgIH1cblxuICAgIGNvbnN0IGFzc2V0RW50cnkgPSBqb2luKG5vcm1hbGl6ZShwcm9qZWN0LnJvb3QpLCAnc3JjJywgJ21hbmlmZXN0Lmpzb24nKTtcblxuICAgIGlmICghcHJvamVjdC5hcmNoaXRlY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXJjaGl0ZWN0IGlzIG5vdCBkZWZpbmVkIGZvciB0aGlzIHByb2plY3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXJjaGl0ZWN0ID0gcHJvamVjdC5hcmNoaXRlY3Q7XG5cbiAgICBbJ2J1aWxkJywgJ3Rlc3QnXS5mb3JFYWNoKCh0YXJnZXQpID0+IHtcblxuICAgICAgY29uc3QgYXBwbHlUbyA9IGFyY2hpdGVjdFt0YXJnZXRdLm9wdGlvbnM7XG5cbiAgICAgIGlmICghYXBwbHlUby5hc3NldHMpIHtcbiAgICAgICAgYXBwbHlUby5hc3NldHMgPSBbYXNzZXRFbnRyeV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBseVRvLmFzc2V0cy5wdXNoKGFzc2V0RW50cnkpO1xuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBob3N0Lm92ZXJ3cml0ZSh3b3Jrc3BhY2VQYXRoLCBKU09OLnN0cmluZ2lmeSh3b3Jrc3BhY2UsIG51bGwsIDIpKTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgaWYgKCFvcHRpb25zLnByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdPcHRpb24gXCJwcm9qZWN0XCIgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0XTtcbiAgICBpZiAocHJvamVjdC5wcm9qZWN0VHlwZSAhPT0gJ2FwcGxpY2F0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFBXQSByZXF1aXJlcyBhIHByb2plY3QgdHlwZSBvZiBcImFwcGxpY2F0aW9uXCIuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRQYXRoID0gam9pbihwcm9qZWN0LnJvb3QgYXMgUGF0aCwgJ3NyYycsICdhc3NldHMnKTtcbiAgICBjb25zdCBzb3VyY2VQYXRoID0gam9pbihwcm9qZWN0LnJvb3QgYXMgUGF0aCwgJ3NyYycpO1xuXG4gICAgb3B0aW9ucy50aXRsZSA9IG9wdGlvbnMudGl0bGUgfHwgb3B0aW9ucy5wcm9qZWN0O1xuXG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMvYXNzZXRzJyksIFtcbiAgICAgIHRlbXBsYXRlKHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIH0pLFxuICAgICAgbW92ZShhc3NldFBhdGgpLFxuICAgIF0pO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIGFkZFNlcnZpY2VXb3JrZXIob3B0aW9ucyksXG4gICAgICBicmFuY2hBbmRNZXJnZShjaGFpbihbXG4gICAgICAgIG1lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZSksXG4gICAgICBdKSksXG4gICAgICBtZXJnZVdpdGgoYXBwbHkodXJsKCcuL2ZpbGVzL3Jvb3QnKSwgW1xuICAgICAgICB0ZW1wbGF0ZSh7Li4ub3B0aW9uc30pLFxuICAgICAgICBtb3ZlKHNvdXJjZVBhdGgpLFxuICAgICAgXSkpLFxuICAgICAgdXBkYXRlSW5kZXhGaWxlKG9wdGlvbnMpLFxuICAgICAgYWRkTWFuaWZlc3RUb0Fzc2V0c0NvbmZpZyhvcHRpb25zKSxcbiAgICBdKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cbiJdfQ==