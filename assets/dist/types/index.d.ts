import type { Application, ControllerConstructor } from '@hotwired/stimulus';
/**
 * Prefix of the Stimulus identifiers: the one produced by
 * stimulus_controller('@romainmillan/mobile-navigation-bundle/<name>'), i.e. by
 * rm_mnb_controller('<name>'). registerMobileNavigation() registers the controllers by
 * hand under these identifiers, for apps that use neither the Symfony UX controllers.json
 * nor AssetMapper.
 */
export declare const IDENTIFIER_PREFIX = "romainmillan--mobile-navigation-bundle--";
export declare const controllers: Readonly<Record<string, ControllerConstructor>>;
export declare function registerMobileNavigation(application: Application): void;
export { haptic } from './utils/haptic';
