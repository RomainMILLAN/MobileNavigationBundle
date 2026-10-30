import { Controller } from '@hotwired/stimulus';
export default class extends Controller<HTMLElement> {
    static values: {
        targetLabel: StringConstructor;
        previousLabel: StringConstructor;
        fallbackLabel: StringConstructor;
    };
    readonly targetLabelValue: string;
    readonly hasTargetLabelValue: boolean;
    readonly previousLabelValue: string;
    readonly fallbackLabelValue: string;
    private readonly onPageChange;
    connect(): void;
    disconnect(): void;
    go(event: MouseEvent): void;
    private refreshLabel;
}
