/**
 * Transforms your Angular application into a Progressive Web App (PWA). PWAs provide a
 * native app-like experience, allowing users to install your app on their devices and
 * access it offline. This schematic configures your project for PWA functionality, adding a
 * service worker, a web app manifest, and other necessary features.
 */
export interface Schema {
    /**
     * The name of the project to transform into a PWA. If not specified, the CLI will determine
     * the project from the current directory.
     */
    project?: string;
    /**
     * The build target to apply the service worker to. This is typically `build`, indicating
     * that the service worker should be generated during the standard build process.
     */
    target?: string;
    /**
     * The title of the application. This will be used in the web app manifest, which is a JSON
     * file that provides metadata about your PWA (e.g., name, icons, display options).
     */
    title?: string;
    [property: string]: any;
}
