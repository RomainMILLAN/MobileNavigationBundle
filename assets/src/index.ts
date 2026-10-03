import type { Application, ControllerConstructor } from '@hotwired/stimulus';

import ConfirmSheetController from './controllers/confirm_sheet_controller';
import EmitEventController from './controllers/emit_event_controller';
import FilterBarController from './controllers/filter_bar_controller';
import GestureController from './controllers/gesture_controller';
import LargeTitleController from './controllers/large_title_controller';
import ListController from './controllers/list_controller';
import NavigateController from './controllers/navigate_controller';
import SheetController from './controllers/sheet_controller';
import SwipeActionsController from './controllers/swipe_actions_controller';
import SwipeBackController from './controllers/swipe_back_controller';
import TabBarController from './controllers/tab_bar_controller';

/**
 * Prefix of the Stimulus identifiers: the one produced by
 * stimulus_controller('@romainmillan/mobile-navigation-bundle/<name>'), i.e. by
 * rm_mnb_controller('<name>'). registerMobileNavigation() registers the controllers by
 * hand under these identifiers, for apps that use neither the Symfony UX controllers.json
 * nor AssetMapper.
 */
export const IDENTIFIER_PREFIX = 'romainmillan--mobile-navigation-bundle--';

export const controllers: Readonly<Record<string, ControllerConstructor>> = {
    'confirm-sheet': ConfirmSheetController,
    'emit-event': EmitEventController,
    'filter-bar': FilterBarController,
    gesture: GestureController,
    'large-title': LargeTitleController,
    list: ListController,
    navigate: NavigateController,
    sheet: SheetController,
    'swipe-actions': SwipeActionsController,
    'swipe-back': SwipeBackController,
    'tab-bar': TabBarController,
};

export function registerMobileNavigation(application: Application): void {
    Object.entries(controllers).forEach(([name, controller]) => {
        application.register(`${IDENTIFIER_PREFIX}${name}`, controller);
    });
}

export { haptic } from './utils/haptic';
