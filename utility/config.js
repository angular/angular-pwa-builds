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
function getWorkspacePath(host) {
    const possibleFiles = ['/angular.json', '/.angular.json'];
    const path = possibleFiles.filter(path => host.exists(path))[0];
    return path;
}
exports.getWorkspacePath = getWorkspacePath;
function getWorkspace(host) {
    const path = getWorkspacePath(host);
    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new schematics_1.SchematicsException(`Could not find (${path})`);
    }
    const content = configBuffer.toString();
    return core_1.parseJson(content, core_1.JsonParseMode.Loose);
}
exports.getWorkspace = getWorkspace;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyL3B3YS91dGlsaXR5L2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUE4RTtBQUM5RSwyREFBdUU7QUFLdkUsMEJBQWlDLElBQVU7SUFDekMsTUFBTSxhQUFhLEdBQUcsQ0FBRSxlQUFlLEVBQUUsZ0JBQWdCLENBQUUsQ0FBQztJQUM1RCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWhFLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBTEQsNENBS0M7QUFFRCxzQkFBNkIsSUFBVTtJQUNyQyxNQUFNLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLEVBQUUsQ0FBQyxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxtQkFBbUIsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRXhDLE1BQU0sQ0FBQyxnQkFBUyxDQUFDLE9BQU8sRUFBRSxvQkFBYSxDQUFDLEtBQUssQ0FBMEIsQ0FBQztBQUMxRSxDQUFDO0FBVEQsb0NBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBKc29uUGFyc2VNb2RlLCBleHBlcmltZW50YWwsIHBhcnNlSnNvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cblxuZXhwb3J0IHR5cGUgV29ya3NwYWNlU2NoZW1hID0gZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2VTY2hlbWE7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3Jrc3BhY2VQYXRoKGhvc3Q6IFRyZWUpOiBzdHJpbmcge1xuICBjb25zdCBwb3NzaWJsZUZpbGVzID0gWyAnL2FuZ3VsYXIuanNvbicsICcvLmFuZ3VsYXIuanNvbicgXTtcbiAgY29uc3QgcGF0aCA9IHBvc3NpYmxlRmlsZXMuZmlsdGVyKHBhdGggPT4gaG9zdC5leGlzdHMocGF0aCkpWzBdO1xuXG4gIHJldHVybiBwYXRoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V29ya3NwYWNlKGhvc3Q6IFRyZWUpOiBXb3Jrc3BhY2VTY2hlbWEge1xuICBjb25zdCBwYXRoID0gZ2V0V29ya3NwYWNlUGF0aChob3N0KTtcbiAgY29uc3QgY29uZmlnQnVmZmVyID0gaG9zdC5yZWFkKHBhdGgpO1xuICBpZiAoY29uZmlnQnVmZmVyID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCBmaW5kICgke3BhdGh9KWApO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBjb25maWdCdWZmZXIudG9TdHJpbmcoKTtcblxuICByZXR1cm4gcGFyc2VKc29uKGNvbnRlbnQsIEpzb25QYXJzZU1vZGUuTG9vc2UpIGFzIHt9IGFzIFdvcmtzcGFjZVNjaGVtYTtcbn1cbiJdfQ==