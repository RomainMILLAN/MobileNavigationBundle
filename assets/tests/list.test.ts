/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import FilterBarController from '../src/controllers/filter_bar_controller';
import ListController from '../src/controllers/list_controller';
import { dedupeSectionHeaders } from '../src/utils/list';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const query = <T extends Element>(selector: string): T => document.querySelector(selector) as T;

const row = (id: number): string => `
    <div class="rm-mnb-list-row">
        <label class="rm-mnb-list-row__select"><input type="checkbox" name="ids[]" value="${id}"></label>
        <a class="rm-mnb-list-row__main" href="/item/${id}" id="link-${id}">Ligne ${id}</a>
    </div>`;

const section = (title: string, ids: number[]): string => `
    <section class="rm-mnb-list-section" aria-label="${title}" data-list-target="section">
        <h3 class="rm-mnb-list-section__header">${title}</h3>
        <div class="rm-mnb-group">${ids.map(row).join('')}</div>
    </section>`;

let application: Application;

beforeAll(() => {
    application = Application.start();
    application.register('list', ListController);
    application.register('filter-bar', FilterBarController);
});

afterEach(async () => {
    document.body.innerHTML = '';
    await tick();
});

describe('dedupeSectionHeaders', () => {
    it('keeps only the first of two identical consecutive headers', () => {
        expect(dedupeSectionHeaders(['Octobre', 'Septembre', 'Septembre', 'Août'])).toEqual([2]);
    });

    it('keeps a title that reappears further down, non-consecutively', () => {
        expect(dedupeSectionHeaders(['Octobre', 'Septembre', 'Octobre'])).toEqual([]);
    });

    it('hides nothing in an empty or flat list', () => {
        expect(dedupeSectionHeaders([])).toEqual([]);
        expect(dedupeSectionHeaders([''])).toEqual([]);
    });
});

describe('list controller', () => {
    beforeEach(async () => {
        document.body.innerHTML = `
            <div data-controller="list">
                <button type="button" id="toggle" data-action="list#toggleSelecting">Sélectionner</button>
                ${section('Octobre 2026', [1, 2])}
                ${section('Octobre 2026', [3])}
                ${section('Septembre 2026', [4])}
            </div>`;
        await tick();
    });

    it('hides the header of a section that continues the previous one', () => {
        const sections = document.querySelectorAll('.rm-mnb-list-section');

        expect(sections[0]?.classList.contains('is-continuation')).toBe(false);
        expect(sections[1]?.classList.contains('is-continuation')).toBe(true);
        expect(sections[2]?.classList.contains('is-continuation')).toBe(false);
    });

    it('lets a tap open the row outside selection mode', () => {
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });

        query<HTMLAnchorElement>('#link-1').dispatchEvent(click);

        expect(click.defaultPrevented).toBe(false);
        expect(query<HTMLInputElement>('input[value="1"]').checked).toBe(false);
    });

    it('checks the row instead of opening it in selection mode, and emits change', () => {
        query<HTMLButtonElement>('#toggle').click();
        const changes: string[] = [];
        document.addEventListener('change', (event) => changes.push((event.target as HTMLInputElement).value));
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });

        query<HTMLAnchorElement>('#link-2').dispatchEvent(click);

        expect(click.defaultPrevented).toBe(true);
        expect(query<HTMLInputElement>('input[value="2"]').checked).toBe(true);
        expect(changes).toEqual(['2']);
    });

    it('obeys the "Select" button placed outside the list (window event)', () => {
        window.dispatchEvent(new CustomEvent('rm-mnb-list:toggle-selecting'));

        expect(query('[data-controller="list"]').classList.contains('is-selecting')).toBe(true);
        expect(document.documentElement.classList.contains('rm-mnb-list-selecting')).toBe(true);

        window.dispatchEvent(new CustomEvent('rm-mnb-list:toggle-selecting'));

        expect(document.documentElement.classList.contains('rm-mnb-list-selecting')).toBe(false);
    });

    it('clears the selection when leaving selection mode', () => {
        query<HTMLButtonElement>('#toggle').click();
        query<HTMLAnchorElement>('#link-1').click();
        query<HTMLAnchorElement>('#link-3').click();

        query<HTMLButtonElement>('#toggle').click();

        expect(document.querySelectorAll('input:checked')).toHaveLength(0);
        expect(query('[data-controller="list"]').classList.contains('is-selecting')).toBe(false);
    });
});

describe('filter-bar controller', () => {
    beforeEach(async () => {
        document.body.innerHTML = `
            <form id="filters"><input name="filter[query]" value="loyer"></form>
            <div data-controller="filter-bar" data-filter-bar-form-value="filters" data-filter-bar-field-value="filter[query]">
                <input id="proxy" data-filter-bar-target="proxy" data-action="filter-bar#mirror">
            </div>`;
        await tick();
    });

    it('picks up the real field value on load', () => {
        expect(query<HTMLInputElement>('#proxy').value).toBe('loyer');
    });

    it('copies the input into the real field and fires input on it', () => {
        const field = query<HTMLInputElement>('input[name="filter[query]"]');
        let inputs = 0;
        field.addEventListener('input', () => inputs++);

        const proxy = query<HTMLInputElement>('#proxy');
        proxy.value = 'courses';
        proxy.dispatchEvent(new Event('input', { bubbles: true }));

        expect(field.value).toBe('courses');
        expect(inputs).toBe(1);
    });
});
