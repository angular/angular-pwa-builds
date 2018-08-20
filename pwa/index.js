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
    return (host) => {
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
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQUE2RDtBQUM3RCwyREFZb0M7QUFDcEMsOENBQW1FO0FBSW5FLDBCQUEwQixPQUFtQjtJQUMzQyxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUMvQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBRWpELE1BQU0sU0FBUyxxQkFDVixPQUFPLENBQ1gsQ0FBQztRQUNGLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztRQUV2QixPQUFPLDhCQUFpQixDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQy9FLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxtQkFBbUIsSUFBWTtJQUM3QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFFaEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7UUFDdkIsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDakMsTUFBTSxJQUFJLElBQUksQ0FBQztTQUNoQjthQUFNO1lBQ0wsTUFBTTtTQUNQO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQseUJBQXlCLE9BQW1CO0lBQzFDLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE1BQU0sU0FBUyxHQUFHLHFCQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBaUIsQ0FBQyxDQUFDO1FBQzlELElBQUksSUFBWSxDQUFDO1FBQ2pCLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElB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QU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLEtBQUssYUFBYSxFQUFFO1lBQ3pDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2hGO1FBRUQsTUFBTSxVQUFVLEdBQUcsV0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxVQUFVLEdBQUcsV0FBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUU5QyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVqRCxNQUFNLGtCQUFrQixHQUFHLGtCQUFLLENBQUMsZ0JBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUNwRCxxQkFBUSxtQkFBTSxPQUFPLEVBQUc7WUFDeEIsaUJBQUksQ0FBQyxVQUFVLENBQUM7U0FDakIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxrQkFBSyxDQUFDLGdCQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtZQUN4RCxxQkFBUSxtQkFBTSxPQUFPLEVBQUc7WUFDeEIsaUJBQUksQ0FBQyxVQUFVLENBQUM7U0FDakIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxrQkFBSyxDQUFDO1lBQ1gsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO1lBQ3pCLHNCQUFTLENBQUMsa0JBQWtCLENBQUM7WUFDN0Isc0JBQVMsQ0FBQyxvQkFBb0IsQ0FBQztZQUMvQixlQUFlLENBQUMsT0FBTyxDQUFDO1lBQ3hCLHlCQUF5QixDQUFDLE9BQU8sQ0FBQztTQUNuQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBakNELDRCQWlDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7IFBhdGgsIGpvaW4sIG5vcm1hbGl6ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBjaGFpbixcbiAgZXh0ZXJuYWxTY2hlbWF0aWMsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgdGVtcGxhdGUsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgZ2V0V29ya3NwYWNlLCBnZXRXb3Jrc3BhY2VQYXRoIH0gZnJvbSAnLi4vdXRpbGl0eS9jb25maWcnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFB3YU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cblxuZnVuY3Rpb24gYWRkU2VydmljZVdvcmtlcihvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnRleHQubG9nZ2VyLmRlYnVnKCdBZGRpbmcgc2VydmljZSB3b3JrZXIuLi4nKTtcblxuICAgIGNvbnN0IHN3T3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcbiAgICBkZWxldGUgc3dPcHRpb25zLnRpdGxlO1xuXG4gICAgcmV0dXJuIGV4dGVybmFsU2NoZW1hdGljKCdAc2NoZW1hdGljcy9hbmd1bGFyJywgJ3NlcnZpY2Utd29ya2VyJywgc3dPcHRpb25zKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5kZW50KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBpbmRlbnQgPSAnJztcblxuICBmb3IgKGNvbnN0IGNoYXIgb2YgdGV4dCkge1xuICAgIGlmIChjaGFyID09PSAnICcgfHwgY2hhciA9PT0gJ1xcdCcpIHtcbiAgICAgIGluZGVudCArPSBjaGFyO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW5kZW50O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVJbmRleEZpbGUob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3QgYXMgc3RyaW5nXTtcbiAgICBsZXQgcGF0aDogc3RyaW5nO1xuICAgIGNvbnN0IHByb2plY3RUYXJnZXRzID0gcHJvamVjdC50YXJnZXRzIHx8IHByb2plY3QuYXJjaGl0ZWN0O1xuICAgIGlmIChwcm9qZWN0ICYmIHByb2plY3RUYXJnZXRzICYmIHByb2plY3RUYXJnZXRzLmJ1aWxkICYmIHByb2plY3RUYXJnZXRzLmJ1aWxkLm9wdGlvbnMuaW5kZXgpIHtcbiAgICAgIHBhdGggPSBwcm9qZWN0VGFyZ2V0cy5idWlsZC5vcHRpb25zLmluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQ291bGQgbm90IGZpbmQgaW5kZXggZmlsZSBmb3IgdGhlIHByb2plY3QnKTtcbiAgICB9XG4gICAgY29uc3QgYnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBDb3VsZCBub3QgcmVhZCBpbmRleCBmaWxlOiAke3BhdGh9YCk7XG4gICAgfVxuICAgIGNvbnN0IGNvbnRlbnQgPSBidWZmZXIudG9TdHJpbmcoKTtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpO1xuICAgIGxldCBjbG9zaW5nSGVhZFRhZ0xpbmVJbmRleCA9IC0xO1xuICAgIGxldCBjbG9zaW5nQm9keVRhZ0xpbmVJbmRleCA9IC0xO1xuICAgIGxpbmVzLmZvckVhY2goKGxpbmUsIGluZGV4KSA9PiB7XG4gICAgICBpZiAoY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXggPT09IC0xICYmIC88XFwvaGVhZD4vLnRlc3QobGluZSkpIHtcbiAgICAgICAgY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXggPSBpbmRleDtcbiAgICAgIH0gZWxzZSBpZiAoY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXggPT09IC0xICYmIC88XFwvYm9keT4vLnRlc3QobGluZSkpIHtcbiAgICAgICAgY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXggPSBpbmRleDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGhlYWRJbmRlbnQgPSBnZXRJbmRlbnQobGluZXNbY2xvc2luZ0hlYWRUYWdMaW5lSW5kZXhdKSArICcgICc7XG4gICAgY29uc3QgaXRlbXNUb0FkZFRvSGVhZCA9IFtcbiAgICAgICc8bGluayByZWw9XCJtYW5pZmVzdFwiIGhyZWY9XCJtYW5pZmVzdC5qc29uXCI+JyxcbiAgICAgICc8bWV0YSBuYW1lPVwidGhlbWUtY29sb3JcIiBjb250ZW50PVwiIzE5NzZkMlwiPicsXG4gICAgXTtcblxuICAgIGNvbnN0IGJvZHlJbmRlbnQgPSBnZXRJbmRlbnQobGluZXNbY2xvc2luZ0JvZHlUYWdMaW5lSW5kZXhdKSArICcgICc7XG4gICAgY29uc3QgaXRlbXNUb0FkZFRvQm9keSA9IFtcbiAgICAgICc8bm9zY3JpcHQ+UGxlYXNlIGVuYWJsZSBKYXZhU2NyaXB0IHRvIGNvbnRpbnVlIHVzaW5nIHRoaXMgYXBwbGljYXRpb24uPC9ub3NjcmlwdD4nLFxuICAgIF07XG5cbiAgICBjb25zdCB1cGRhdGVkSW5kZXggPSBbXG4gICAgICAuLi5saW5lcy5zbGljZSgwLCBjbG9zaW5nSGVhZFRhZ0xpbmVJbmRleCksXG4gICAgICAuLi5pdGVtc1RvQWRkVG9IZWFkLm1hcChsaW5lID0+IGhlYWRJbmRlbnQgKyBsaW5lKSxcbiAgICAgIC4uLmxpbmVzLnNsaWNlKGNsb3NpbmdIZWFkVGFnTGluZUluZGV4LCBjbG9zaW5nQm9keVRhZ0xpbmVJbmRleCksXG4gICAgICAuLi5pdGVtc1RvQWRkVG9Cb2R5Lm1hcChsaW5lID0+IGJvZHlJbmRlbnQgKyBsaW5lKSxcbiAgICAgIC4uLmxpbmVzLnNsaWNlKGNsb3NpbmdCb2R5VGFnTGluZUluZGV4KSxcbiAgICBdLmpvaW4oJ1xcbicpO1xuXG4gICAgaG9zdC5vdmVyd3JpdGUocGF0aCwgdXBkYXRlZEluZGV4KTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRNYW5pZmVzdFRvQXNzZXRzQ29uZmlnKG9wdGlvbnM6IFB3YU9wdGlvbnMpIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG5cbiAgICBjb25zdCB3b3Jrc3BhY2VQYXRoID0gZ2V0V29ya3NwYWNlUGF0aChob3N0KTtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3QgYXMgc3RyaW5nXTtcblxuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm9qZWN0IGlzIG5vdCBkZWZpbmVkIGluIHRoaXMgd29ya3NwYWNlLmApO1xuICAgIH1cblxuICAgIGNvbnN0IGFzc2V0RW50cnkgPSBqb2luKG5vcm1hbGl6ZShwcm9qZWN0LnJvb3QpLCAnc3JjJywgJ21hbmlmZXN0Lmpzb24nKTtcblxuICAgIGNvbnN0IHByb2plY3RUYXJnZXRzID0gcHJvamVjdC50YXJnZXRzIHx8IHByb2plY3QuYXJjaGl0ZWN0O1xuICAgIGlmICghcHJvamVjdFRhcmdldHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGFyZ2V0cyBhcmUgbm90IGRlZmluZWQgZm9yIHRoaXMgcHJvamVjdC5gKTtcbiAgICB9XG5cbiAgICBbJ2J1aWxkJywgJ3Rlc3QnXS5mb3JFYWNoKCh0YXJnZXQpID0+IHtcblxuICAgICAgY29uc3QgYXBwbHlUbyA9IHByb2plY3RUYXJnZXRzW3RhcmdldF0ub3B0aW9ucztcbiAgICAgIGNvbnN0IGFzc2V0cyA9IGFwcGx5VG8uYXNzZXRzIHx8IChhcHBseVRvLmFzc2V0cyA9IFtdKTtcblxuICAgICAgYXNzZXRzLnB1c2goYXNzZXRFbnRyeSk7XG5cbiAgICB9KTtcblxuICAgIGhvc3Qub3ZlcndyaXRlKHdvcmtzcGFjZVBhdGgsIEpTT04uc3RyaW5naWZ5KHdvcmtzcGFjZSwgbnVsbCwgMikpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBQd2FPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiBcInByb2plY3RcIiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0c1tvcHRpb25zLnByb2plY3RdO1xuICAgIGlmIChwcm9qZWN0LnByb2plY3RUeXBlICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUFdBIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VQYXRoID0gam9pbihwcm9qZWN0LnJvb3QgYXMgUGF0aCwgJ3NyYycpO1xuICAgIGNvbnN0IGFzc2V0c1BhdGggPSBqb2luKHNvdXJjZVBhdGgsICdhc3NldHMnKTtcblxuICAgIG9wdGlvbnMudGl0bGUgPSBvcHRpb25zLnRpdGxlIHx8IG9wdGlvbnMucHJvamVjdDtcblxuICAgIGNvbnN0IHJvb3RUZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcy9yb290JyksIFtcbiAgICAgIHRlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSxcbiAgICAgIG1vdmUoc291cmNlUGF0aCksXG4gICAgXSk7XG4gICAgY29uc3QgYXNzZXRzVGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMvYXNzZXRzJyksIFtcbiAgICAgIHRlbXBsYXRlKHsgLi4ub3B0aW9ucyB9KSxcbiAgICAgIG1vdmUoYXNzZXRzUGF0aCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYWRkU2VydmljZVdvcmtlcihvcHRpb25zKSxcbiAgICAgIG1lcmdlV2l0aChyb290VGVtcGxhdGVTb3VyY2UpLFxuICAgICAgbWVyZ2VXaXRoKGFzc2V0c1RlbXBsYXRlU291cmNlKSxcbiAgICAgIHVwZGF0ZUluZGV4RmlsZShvcHRpb25zKSxcbiAgICAgIGFkZE1hbmlmZXN0VG9Bc3NldHNDb25maWcob3B0aW9ucyksXG4gICAgXSk7XG4gIH07XG59XG4iXX0=