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
function default_1(options) {
    return (host, context) => {
        const workspace = config_1.getWorkspace(host);
        const project = workspace.projects[options.project];
        const assetPath = core_1.join(project.root, 'src', 'assets');
        const tempalteSource = schematics_1.apply(schematics_1.url('./files/assets'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(assetPath),
        ]);
        return schematics_1.chain([
            addServiceWorker(options),
            schematics_1.branchAndMerge(schematics_1.chain([
                schematics_1.mergeWith(tempalteSource),
            ])),
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXIvcHdhL3B3YS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7RUFNRTtBQUNGLCtDQUFrRDtBQUNsRCwyREFZb0M7QUFDcEMsOENBQWlEO0FBSWpELDBCQUEwQixPQUFtQjtJQUMzQyxNQUFNLENBQUMsQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFFakQsTUFBTSxDQUFDLDhCQUFpQixDQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsbUJBQXlCLE9BQW1CO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsTUFBTSxTQUFTLEdBQUcscUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwRCxNQUFNLFNBQVMsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLElBQVksRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFOUQsTUFBTSxjQUFjLEdBQUcsa0JBQUssQ0FBQyxnQkFBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDbEQscUJBQVEsbUJBQ0gsT0FBTyxFQUNWO1lBQ0YsaUJBQUksQ0FBQyxTQUFTLENBQUM7U0FDaEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGtCQUFLLENBQUM7WUFDWCxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7WUFDekIsMkJBQWMsQ0FBQyxrQkFBSyxDQUFDO2dCQUNuQixzQkFBUyxDQUFDLGNBQWMsQ0FBQzthQUMxQixDQUFDLENBQUM7U0FDSixDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFyQkQsNEJBcUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHsgUGF0aCwgam9pbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBicmFuY2hBbmRNZXJnZSxcbiAgY2hhaW4sXG4gIGV4dGVybmFsU2NoZW1hdGljLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIHRlbXBsYXRlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvY29uZmlnJztcbmltcG9ydCB7IFNjaGVtYSBhcyBQd2FPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5cbmZ1bmN0aW9uIGFkZFNlcnZpY2VXb3JrZXIob3B0aW9uczogUHdhT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LmxvZ2dlci5kZWJ1ZygnQWRkaW5nIHNlcnZpY2Ugd29ya2VyLi4uJyk7XG5cbiAgICByZXR1cm4gZXh0ZXJuYWxTY2hlbWF0aWMoJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLCAnc2VydmljZS13b3JrZXInLCBvcHRpb25zKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFB3YU9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbb3B0aW9ucy5wcm9qZWN0XTtcblxuICAgIGNvbnN0IGFzc2V0UGF0aCA9IGpvaW4ocHJvamVjdC5yb290IGFzIFBhdGgsICdzcmMnLCAnYXNzZXRzJyk7XG5cbiAgICBjb25zdCB0ZW1wYWx0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcy9hc3NldHMnKSwgW1xuICAgICAgdGVtcGxhdGUoe1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgfSksXG4gICAgICBtb3ZlKGFzc2V0UGF0aCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYWRkU2VydmljZVdvcmtlcihvcHRpb25zKSxcbiAgICAgIGJyYW5jaEFuZE1lcmdlKGNoYWluKFtcbiAgICAgICAgbWVyZ2VXaXRoKHRlbXBhbHRlU291cmNlKSxcbiAgICAgIF0pKSxcbiAgICBdKShob3N0LCBjb250ZXh0KTtcbiAgfTtcbn1cbiJdfQ==