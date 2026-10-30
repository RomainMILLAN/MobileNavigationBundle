import { type SavedHistory } from './history_stack';
export declare function readSaved(): SavedHistory | null;
export declare function writeSaved(saved: SavedHistory): void;
export declare function clearSaved(): void;
