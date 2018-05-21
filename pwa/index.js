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
        let closingBodyTagLineIndex = -1;
        let closingBodyTagLine = '';
        lines.forEach((line, index) => {
            if (/<\/head>/.test(line) && closingHeadTagLineIndex === -1) {
                closingHeadTagLine = line;
                closingHeadTagLineIndex = index;
            }
            if (/<\/body>/.test(line) && closingBodyTagLineIndex === -1) {
                closingBodyTagLine = line;
                closingBodyTagLineIndex = index;
            }
        });
        const headTagIndent = getIndent(closingHeadTagLine) + '  ';
        const itemsToAddToHead = [
            '<link rel="manifest" href="manifest.json">',
            '<meta name="theme-color" content="#1976d2">',
        ];
        const textToInsertIntoHead = itemsToAddToHead
            .map(text => headTagIndent + text)
            .join('\n');
        const bodyTagIndent = getIndent(closingBodyTagLine) + '  ';
        const itemsToAddToBody = '<noscript>Please enable JavaScript to continue using this application.</noscript>';
        const textToInsertIntoBody = bodyTagIndent + itemsToAddToBody;
        const updatedIndex = [
            ...lines.slice(0, closingHeadTagLineIndex),
            textToInsertIntoHead,
            ...lines.slice(closingHeadTagLineIndex, closingBodyTagLineIndex),
            textToInsertIntoBody,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQUE2RDtBQUM3RCwyREFhb0M7QUFDcEMsOENBQW1FO0FBSW5FLDBCQUEwQixPQUFtQjtJQUMzQyxNQUFNLENBQUMsQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFFakQsTUFBTSxDQUFDLDhCQUFpQixDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsbUJBQW1CLElBQVk7SUFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztTQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNkLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDaEIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sV0FBVyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO0lBQ0gsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRVIsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQseUJBQXlCLE9BQW1CO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsTUFBTSxTQUFTLEdBQUcscUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxN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QyxnQkFBZ0IsQ0FBQyxFQUFFO1lBQ2xELHFCQUFRLG1CQUNILE9BQU8sRUFDVjtZQUNGLGlCQUFJLENBQUMsU0FBUyxDQUFDO1NBQ2hCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxrQkFBSyxDQUFDO1lBQ1gsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO1lBQ3pCLDJCQUFjLENBQUMsa0JBQUssQ0FBQztnQkFDbkIsc0JBQVMsQ0FBQyxjQUFjLENBQUM7YUFDMUIsQ0FBQyxDQUFDO1lBQ0gsc0JBQVMsQ0FBQyxrQkFBSyxDQUFDLGdCQUFHLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ25DLHFCQUFRLG1CQUFLLE9BQU8sRUFBRTtnQkFDdEIsaUJBQUksQ0FBQyxVQUFVLENBQUM7YUFDakIsQ0FBQyxDQUFDO1lBQ0gsZUFBZSxDQUFDLE9BQU8sQ0FBQztZQUN4Qix5QkFBeUIsQ0FBQyxPQUFPLENBQUM7U0FDbkMsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUM7QUFDSixDQUFDO0FBcENELDRCQW9DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7IFBhdGgsIGpvaW4sIG5vcm1hbGl6ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBicmFuY2hBbmRNZXJnZSxcbiAgY2hhaW4sXG4gIGV4dGVybmFsU2NoZW1hdGljLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIHRlbXBsYXRlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZSwgZ2V0V29ya3NwYWNlUGF0aCB9IGZyb20gJy4uL3V0aWxpdHkvY29uZmlnJztcbmltcG9ydCB7IFNjaGVtYSBhcyBQd2FPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5cbmZ1bmN0aW9uIGFkZFNlcnZpY2VXb3JrZXIob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LmxvZ2dlci5kZWJ1ZygnQWRkaW5nIHNlcnZpY2Ugd29ya2VyLi4uJyk7XG5cbiAgICByZXR1cm4gZXh0ZXJuYWxTY2hlbWF0aWMoJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLCAnc2VydmljZS13b3JrZXInLCBvcHRpb25zKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5kZW50KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBpbmRlbnQgPSAnJztcbiAgbGV0IGhpdE5vblNwYWNlID0gZmFsc2U7XG4gIHRleHQuc3BsaXQoJycpXG4gICAgLmZvckVhY2goY2hhciA9PiB7XG4gICAgICBpZiAoY2hhciA9PT0gJyAnICYmICFoaXROb25TcGFjZSkge1xuICAgICAgICBpbmRlbnQgKz0gJyAnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGl0Tm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfVxuICAgIH0sIDApO1xuXG4gIHJldHVybiBpbmRlbnQ7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUluZGV4RmlsZShvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzW29wdGlvbnMucHJvamVjdCBhcyBzdHJpbmddO1xuICAgIGxldCBwYXRoOiBzdHJpbmc7XG4gICAgaWYgKHByb2plY3QgJiYgcHJvamVjdC5hcmNoaXRlY3QgJiYgcHJvamVjdC5hcmNoaXRlY3QuYnVpbGQgJiZcbiAgICAgICAgcHJvamVjdC5hcmNoaXRlY3QuYnVpbGQub3B0aW9ucy5pbmRleCkge1xuICAgICAgcGF0aCA9IHByb2plY3QuYXJjaGl0ZWN0LmJ1aWxkLm9wdGlvbnMuaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdDb3VsZCBub3QgZmluZCBpbmRleCBmaWxlIGZvciB0aGUgcHJvamVjdCcpO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBob3N0LnJlYWQocGF0aCk7XG4gICAgaWYgKGJ1ZmZlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCByZWFkIGluZGV4IGZpbGU6ICR7cGF0aH1gKTtcbiAgICB9XG4gICAgY29uc3QgY29udGVudCA9IGJ1ZmZlci50b1N0cmluZygpO1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgbGV0IGNsb3NpbmdIZWFkVGFnTGluZUluZGV4ID0gLTE7XG4gICAgbGV0IGNsb3NpbmdIZWFkVGFnTGluZSA9ICcnO1xuICAgIGxldCBjbG9zaW5nQm9keVRhZ0xpbmVJbmRleCA9IC0xO1xuICAgIGxldCBjbG9zaW5nQm9keVRhZ0xpbmUgPSAnJztcbiAgICBsaW5lcy5mb3JFYWNoKChsaW5lOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGlmICgvPFxcL2hlYWQ+Ly50ZXN0KGxpbmUpICYmIGNsb3NpbmdIZWFkVGFnTGluZUluZGV4ID09PSAtMSkge1xuICAgICAgICBjbG9zaW5nSGVhZFRhZ0xpbmUgPSBsaW5lO1xuICAgICAgICBjbG9zaW5nSGVhZFRhZ0xpbmVJbmRleCA9IGluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAoLzxcXC9ib2R5Pi8udGVzdChsaW5lKSAmJiBjbG9zaW5nQm9keVRhZ0xpbmVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xvc2luZ0JvZHlUYWdMaW5lID0gbGluZTtcbiAgICAgICAgY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXggPSBpbmRleDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGhlYWRUYWdJbmRlbnQgPSBnZXRJbmRlbnQoY2xvc2luZ0hlYWRUYWdMaW5lKSArICcgICc7XG4gICAgY29uc3QgaXRlbXNUb0FkZFRvSGVhZCA9IFtcbiAgICAgICc8bGluayByZWw9XCJtYW5pZmVzdFwiIGhyZWY9XCJtYW5pZmVzdC5qc29uXCI+JyxcbiAgICAgICc8bWV0YSBuYW1lPVwidGhlbWUtY29sb3JcIiBjb250ZW50PVwiIzE5NzZkMlwiPicsXG4gICAgXTtcblxuICAgIGNvbnN0IHRleHRUb0luc2VydEludG9IZWFkID0gaXRlbXNUb0FkZFRvSGVhZFxuICAgICAgLm1hcCh0ZXh0ID0+IGhlYWRUYWdJbmRlbnQgKyB0ZXh0KVxuICAgICAgLmpvaW4oJ1xcbicpO1xuXG4gICAgY29uc3QgYm9keVRhZ0luZGVudCA9IGdldEluZGVudChjbG9zaW5nQm9keVRhZ0xpbmUpICsgJyAgJztcbiAgICBjb25zdCBpdGVtc1RvQWRkVG9Cb2R5XG4gICAgICA9ICc8bm9zY3JpcHQ+UGxlYXNlIGVuYWJsZSBKYXZhU2NyaXB0IHRvIGNvbnRpbnVlIHVzaW5nIHRoaXMgYXBwbGljYXRpb24uPC9ub3NjcmlwdD4nO1xuXG4gICAgY29uc3QgdGV4dFRvSW5zZXJ0SW50b0JvZHkgPSBib2R5VGFnSW5kZW50ICsgaXRlbXNUb0FkZFRvQm9keTtcblxuICAgIGNvbnN0IHVwZGF0ZWRJbmRleCA9IFtcbiAgICAgIC4uLmxpbmVzLnNsaWNlKDAsIGNsb3NpbmdIZWFkVGFnTGluZUluZGV4KSxcbiAgICAgIHRleHRUb0luc2VydEludG9IZWFkLFxuICAgICAgLi4ubGluZXMuc2xpY2UoY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXgsIGNsb3NpbmdCb2R5VGFnTGluZUluZGV4KSxcbiAgICAgIHRleHRUb0luc2VydEludG9Cb2R5LFxuICAgICAgLi4ubGluZXMuc2xpY2UoY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXgpLFxuICAgIF0uam9pbignXFxuJyk7XG5cbiAgICBob3N0Lm92ZXJ3cml0ZShwYXRoLCB1cGRhdGVkSW5kZXgpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZE1hbmlmZXN0VG9Bc3NldHNDb25maWcob3B0aW9uczogUHdhT3B0aW9ucykge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcblxuICAgIGNvbnN0IHdvcmtzcGFjZVBhdGggPSBnZXRXb3Jrc3BhY2VQYXRoKGhvc3QpO1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzW29wdGlvbnMucHJvamVjdCBhcyBzdHJpbmddO1xuXG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb2plY3QgaXMgbm90IGRlZmluZWQgaW4gdGhpcyB3b3Jrc3BhY2UuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRFbnRyeSA9IGpvaW4obm9ybWFsaXplKHByb2plY3Qucm9vdCksICdzcmMnLCAnbWFuaWZlc3QuanNvbicpO1xuXG4gICAgaWYgKCFwcm9qZWN0LmFyY2hpdGVjdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBcmNoaXRlY3QgaXMgbm90IGRlZmluZWQgZm9yIHRoaXMgcHJvamVjdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBhcmNoaXRlY3QgPSBwcm9qZWN0LmFyY2hpdGVjdDtcblxuICAgIFsnYnVpbGQnLCAndGVzdCddLmZvckVhY2goKHRhcmdldCkgPT4ge1xuXG4gICAgICBjb25zdCBhcHBseVRvID0gYXJjaGl0ZWN0W3RhcmdldF0ub3B0aW9ucztcblxuICAgICAgaWYgKCFhcHBseVRvLmFzc2V0cykge1xuICAgICAgICBhcHBseVRvLmFzc2V0cyA9IFthc3NldEVudHJ5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGx5VG8uYXNzZXRzLnB1c2goYXNzZXRFbnRyeSk7XG4gICAgICB9XG5cbiAgICB9KTtcblxuICAgIGhvc3Qub3ZlcndyaXRlKHdvcmtzcGFjZVBhdGgsIEpTT04uc3RyaW5naWZ5KHdvcmtzcGFjZSwgbnVsbCwgMikpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3RdO1xuICAgIGlmIChwcm9qZWN0LnByb2plY3RUeXBlICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUFdBIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldFBhdGggPSBqb2luKHByb2plY3Qucm9vdCBhcyBQYXRoLCAnc3JjJywgJ2Fzc2V0cycpO1xuICAgIGNvbnN0IHNvdXJjZVBhdGggPSBqb2luKHByb2plY3Qucm9vdCBhcyBQYXRoLCAnc3JjJyk7XG5cbiAgICBvcHRpb25zLnRpdGxlID0gb3B0aW9ucy50aXRsZSB8fCBvcHRpb25zLnByb2plY3Q7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW1xuICAgICAgdGVtcGxhdGUoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgfSksXG4gICAgICBtb3ZlKGFzc2V0UGF0aCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYWRkU2VydmljZVdvcmtlcihvcHRpb25zKSxcbiAgICAgIGJyYW5jaEFuZE1lcmdlKGNoYWluKFtcbiAgICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSxcbiAgICAgIF0pKSxcbiAgICAgIG1lcmdlV2l0aChhcHBseSh1cmwoJy4vZmlsZXMvcm9vdCcpLCBbXG4gICAgICAgIHRlbXBsYXRlKHsuLi5vcHRpb25zfSksXG4gICAgICAgIG1vdmUoc291cmNlUGF0aCksXG4gICAgICBdKSksXG4gICAgICB1cGRhdGVJbmRleEZpbGUob3B0aW9ucyksXG4gICAgICBhZGRNYW5pZmVzdFRvQXNzZXRzQ29uZmlnKG9wdGlvbnMpLFxuICAgIF0pKGhvc3QsIGNvbnRleHQpO1xuICB9O1xufVxuIl19