import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The bundle knows nothing of the apps that use it: these rules fail as soon as it
 * depends on an app, its theme, its routes or its controllers, or as soon as a template
 * outputs unescaped data.
 */
const BUNDLE_ROOT = resolve(__dirname, '../..');

// Turbo is an optional peer dependency: it is read from window.Turbo, never imported.
const RUNTIME_PACKAGES = ['@hotwired/stimulus'];
const TOOLING_PACKAGES = ['vite', 'vitest', 'vitest/config', 'node:fs', 'node:path'];
const PACKAGE_NAME = '@romainmillan/mobile-navigation-bundle/';
// Only types guaranteed escaped: StimulusAttributes (fabAttributes, selectable.attributes,
// reorder.attributes) and ValueAttributes (this.valueAttributes, this.captionAttributes).
const RAW_ALLOWED = ['fabAttributes', 'selectable.attributes', 'reorder.attributes', 'this.valueAttributes', 'this.captionAttributes'];
// Classes of the apps that used to live in the bundle: never again.
const APP_CLASSES = ['maskable', 'rm-mnb-bulk-bar', 'rm-mnb-avatar', 'rm-mnb-identity', 'rm-mnb-row--action', 'rm-mnb-list-host', 'rm-mnb-filter-reset-label'];
const LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall', 'prepare'];

function filesOf(directory: string, extension: string): string[] {
    return readdirSync(directory).flatMap((name) => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) {
            return ['node_modules', 'dist'].includes(name) ? [] : filesOf(path, extension);
        }

        return path.endsWith(extension) ? [path] : [];
    });
}

function read(path: string): string {
    return readFileSync(path, 'utf8');
}

function label(path: string): string {
    return relative(BUNDLE_ROOT, path);
}

function withoutComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
}

function withoutTwigComments(source: string): string {
    return source.replace(/\{#[\s\S]*?#\}/g, '');
}

const typescriptFiles = filesOf(join(BUNDLE_ROOT, 'assets'), '.ts');
const sourceFiles = filesOf(join(BUNDLE_ROOT, 'assets/src'), '.ts');
const scssFiles = filesOf(join(BUNDLE_ROOT, 'assets/styles'), '.scss');
const templateFiles = filesOf(join(BUNDLE_ROOT, 'templates'), '.twig');

describe('bundle isolation', () => {
    it('finds the bundle files', () => {
        expect(typescriptFiles.length).toBeGreaterThan(5);
        expect(scssFiles.length).toBeGreaterThan(5);
        expect(templateFiles.length).toBeGreaterThan(5);
    });

    it.each(typescriptFiles.map((path) => [label(path), path]))('%s imports nothing outside the bundle', (_, path) => {
        const isSource = path.startsWith(join(BUNDLE_ROOT, 'assets/src'));
        const imports = [...read(path).matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((match) => match[1] ?? '');

        imports.forEach((specifier) => {
            if (specifier.startsWith('.')) {
                const target = resolve(dirname(path), specifier);
                expect(target.startsWith(BUNDLE_ROOT), `${specifier} leaves the bundle`).toBe(true);
            } else {
                const allowed = isSource ? RUNTIME_PACKAGES : [...RUNTIME_PACKAGES, ...TOOLING_PACKAGES];
                expect(allowed, `${specifier} is not an allowed dependency`).toContain(specifier);
            }
        });
    });

    it.each(sourceFiles.map((path) => [label(path), path]))('%s never writes HTML or styles as strings', (_, path) => {
        const source = withoutComments(read(path));

        expect(source).not.toMatch(/\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=|style\.cssText/);
    });

    it.each(sourceFiles.map((path) => [label(path), path]))('%s only leaves the page through the navigate controller', (_, path) => {
        if (path.endsWith('navigate_controller.ts')) {
            return;
        }

        expect(withoutComments(read(path))).not.toContain('location.assign(');
    });

    it.each(scssFiles.map((path) => [label(path), path]))('%s knows neither the app theme nor its structure', (_, path) => {
        const source = read(path);

        ['--theme-', '--bs-', '.content-page', '.page-title-box', '.app-topbar'].forEach((forbidden) => {
            expect(source.includes(forbidden), `${forbidden} found`).toBe(false);
        });
        [...source.matchAll(/@(?:use|forward)\s+'([^']+)'/g)].forEach(([, specifier]) => {
            expect(specifier?.startsWith('..'), `${specifier} leaves the bundle`).toBe(false);
        });
    });

    it.each([...scssFiles, ...sourceFiles, ...templateFiles].map((path) => [label(path), path]))('%s holds no app class', (_, path) => {
        const source = read(path);

        APP_CLASSES.forEach((forbidden) => {
            expect(source.includes(forbidden), `${forbidden} found`).toBe(false);
        });
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s depends on no app route, function or icon', (_, path) => {
        const source = read(path);

        ["path('app_", 'current_organization', 'ti ti-'].forEach((forbidden) => {
            expect(source.includes(forbidden), `${forbidden} found`).toBe(false);
        });
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s only translates in the rm_mnb domain', (_, path) => {
        const source = read(path);
        const translations = [...source.matchAll(/\|trans\b(\([^)]*\))?/g)];
        if (translations.length === 0) {
            return;
        }

        translations.forEach(([call, args]) => {
            const explicitDomain = args?.match(/,\s*'([^']+)'\s*\)$/)?.[1];
            if (explicitDomain !== undefined) {
                expect(explicitDomain, call).toBe('rm_mnb');
            } else {
                expect(source, `${call} without domain`).toContain("{% trans_default_domain 'rm_mnb' %}");
            }
        });
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s names its controllers through rm_mnb_controller()', (_, path) => {
        const source = read(path);

        expect(source.includes(PACKAGE_NAME), 'the package name is spelled out').toBe(false);
        [...source.matchAll(/stimulus_(?:controller|target|action)\(\s*([^,)]+)/g)].forEach(([call, identifier]) => {
            expect(identifier?.trim().startsWith('rm_mnb_controller('), call).toBe(true);
        });
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s only outputs |raw on types guaranteed escaped', (_, path) => {
        const raws = [...read(path).matchAll(/([\w.]+)\|raw\b/g)].map((match) => match[1]);

        raws.forEach((variable) => {
            expect(RAW_ALLOWED, `${variable}|raw`).toContain(variable);
        });
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s only renders an <i> inside an icon block', (_, path) => {
        // Blocks are not nested around icons: an <i> sits between "{% block *icon %}" and
        // the next "{% endblock %}".
        const outsideIconBlocks = withoutTwigComments(read(path)).replace(/\{%-?\s*block\s+\w*icon\s*-?%\}[\s\S]*?\{%-?\s*endblock\s*-?%\}/g, '');

        expect(outsideIconBlocks).not.toMatch(/<i[\s>]/);
    });

    it.each(templateFiles.map((path) => [label(path), path]))('%s defines each block once', (_, path) => {
        const names = [...read(path).matchAll(/\{%-?\s*block\s+(\w+)/g)].map((match) => match[1]);

        expect(names.length, names.join(', ')).toBe(new Set(names).size);
    });

    it('runs no install script', () => {
        const manifest = JSON.parse(read(join(BUNDLE_ROOT, 'assets/package.json'))) as { scripts?: Record<string, string> };

        LIFECYCLE_SCRIPTS.forEach((script) => {
            expect(Object.keys(manifest.scripts ?? {}), script).not.toContain(script);
        });
    });
});
