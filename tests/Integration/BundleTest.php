<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\MobileNavigationBundle;
use RomainMillan\MobileNavigation\Twig\MobileNavigationExtension;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\Translation\LocaleSwitcher;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Environment;

final class BundleTest extends IntegrationTestCase
{
    #[Test]
    public function it_should_boot_and_register_its_twig_extension(): void
    {
        $kernel = self::bootKernel();

        self::assertInstanceOf(MobileNavigationBundle::class, $kernel->getBundle('MobileNavigationBundle'));
        self::assertSame('mobile_navigation', $kernel->getBundle('MobileNavigationBundle')->getContainerExtension()?->getAlias());
        self::assertSame('@romainmillan/mobile-navigation-bundle/x', $this->renderTemplate("{{ rm_mnb_controller('x') }}"));
        $twig = self::getContainer()->get('twig');
        self::assertInstanceOf(Environment::class, $twig);
        self::assertTrue($twig->hasExtension(MobileNavigationExtension::class));
    }

    #[Test]
    public function it_should_let_the_app_override_a_component_template(): void
    {
        self::bootKernel(['environment' => 'override']);

        $link = $this->renderComponent('BackButton', ['href' => '/accounts', 'label' => 'Accounts'])->filter('a');

        self::assertSame('app-back', $link->attr('class'));
        self::assertNotNull($link->attr('data-app-override'));
        self::assertSame('Accounts', $link->text());
    }

    #[Test]
    public function it_should_let_the_app_override_the_tab_bar_icon_blocks(): void
    {
        foreach (['link' => ['href' => '/new'], 'sheet' => ['sheet' => 'add'], 'disabled' => []] as $variant => $fab) {
            $crawler = new Crawler($this->renderTemplate(<<<'TWIG'
                {% component 'MobileNavigation:TabBar' with {label: 'Nav', tabs: tabs, fab: fab, more: {sheet: 'more', label: 'More', icon: 'icon-more'}} %}
                    {% block tab_icon %}<svg class="app-tab-icon" data-label="{{ tab.label }}"></svg>{% endblock %}
                    {% block more_icon %}<svg class="app-more-icon" data-label="{{ more.label }}"></svg>{% endblock %}
                    {% block fab_icon %}<svg class="app-fab-icon" data-label="{{ fab.label }}"></svg>{% endblock %}
                {% endcomponent %}
                TWIG, [
                'tabs' => [['href' => '/', 'label' => 'Home', 'icon' => 'icon-home'], ['href' => '/a', 'label' => 'Accounts', 'icon' => 'icon-bank']],
                'fab' => ['label' => 'Add', 'icon' => 'icon-plus', ...$fab],
            ]));

            self::assertSame(['Home', 'Accounts'], $crawler->filter('.rm-mnb-tab-bar__tab .rm-mnb-icon-slot > svg.app-tab-icon')->each(static fn (Crawler $icon): ?string => $icon->attr('data-label')), $variant);
            self::assertSame('More', $crawler->filter('.rm-mnb-icon-slot > svg.app-more-icon')->attr('data-label'), $variant);
            self::assertSame('Add', $crawler->filter('.rm-mnb-tab-bar-fab .rm-mnb-icon-slot > svg.app-fab-icon')->attr('data-label'), $variant);
            self::assertCount(0, $crawler->filter('i'), $variant);
        }
    }

    #[Test]
    public function it_should_let_the_app_override_the_list_row_and_sheet_row_icon_blocks(): void
    {
        $crawler = new Crawler($this->renderTemplate(<<<'TWIG'
            {% component 'MobileNavigation:ListRow' with {title: 'Groceries', leading: {icon: 'icon-cart', tone: 'accent'}} %}
                {% block leading_icon %}<svg class="app-leading" data-icon="{{ leading.icon }}"></svg>{% endblock %}
            {% endcomponent %}
            {% component 'MobileNavigation:SheetRow' with {label: 'Bank', icon: 'icon-bank'} %}
                {% block icon %}<svg class="app-chip" data-icon="{{ icon }}"></svg>{% endblock %}
            {% endcomponent %}
            TWIG));

        self::assertSame('icon-cart', $crawler->filter('.rm-mnb-chip .rm-mnb-icon-slot > svg.app-leading')->attr('data-icon'));
        self::assertSame('icon-bank', $crawler->filter('.rm-mnb-chip .rm-mnb-icon-slot > svg.app-chip')->attr('data-icon'));
        self::assertCount(0, $crawler->filter('i'));
    }

    #[Test]
    public function it_should_let_the_app_override_the_actions_disc_and_empty_state_icon_blocks(): void
    {
        $crawler = new Crawler($this->renderTemplate(<<<'TWIG'
            {% component 'MobileNavigation:ActionsDisc' with {sheet: 'actions'} %}
                {% block icon %}<svg class="app-dots"></svg>{% endblock %}
            {% endcomponent %}
            {% component 'MobileNavigation:EmptyState' with {title: 'Nothing', icon: 'icon-empty'} %}
                {% block icon %}<svg class="app-empty" data-icon="{{ icon }}"></svg>{% endblock %}
            {% endcomponent %}
            TWIG));

        self::assertCount(1, $crawler->filter('button.rm-mnb-glass-disc .rm-mnb-icon-slot > svg.app-dots'));
        self::assertCount(0, $crawler->filter('.rm-mnb-icon--more'));
        self::assertSame('icon-empty', $crawler->filter('.rm-mnb-empty-state__icon .rm-mnb-icon-slot > svg.app-empty')->attr('data-icon'));
        self::assertCount(0, $crawler->filter('i'));
    }

    #[Test]
    public function it_should_let_an_app_component_compose_a_bundle_component_with_built_values(): void
    {
        $crawler = new Crawler($this->renderTemplate("{{ component('AppRow') }}"));

        $row = $crawler->filter('.app-row > .rm-mnb-list-row');
        self::assertSame('romainmillan--mobile-navigation-bundle--swipe-actions', $row->attr('data-controller'));
        self::assertStringContainsString('rm-mnb-tone--positive', (string) $row->filter('.rm-mnb-chip')->attr('class'));
        self::assertStringContainsString('rm-mnb-tone--positive', (string) $row->filter('.rm-mnb-list-row__value')->attr('class'));
        self::assertSame('', $row->filter('.rm-mnb-list-row__value')->attr('data-maskable'));
    }

    #[Test]
    public function it_should_translate_in_english_and_french(): void
    {
        self::assertSame('Back to Accounts', $this->renderComponent('BackButton', ['href' => '/a', 'label' => 'Accounts'])->filter('a')->attr('aria-label'));

        $localeSwitcher = self::getContainer()->get('translation.locale_switcher');
        self::assertInstanceOf(LocaleSwitcher::class, $localeSwitcher);
        $localeSwitcher->setLocale('fr');

        self::assertSame('Retour à Comptes', $this->renderComponent('BackButton', ['href' => '/a', 'label' => 'Comptes'])->filter('a')->attr('aria-label'));
        $translator = self::getContainer()->get('translator');
        self::assertInstanceOf(TranslatorInterface::class, $translator);
        foreach (['sheet.close' => 'Fermer', 'list.select' => 'Sélectionner', 'list.done' => 'Terminé', 'list.load_more' => 'Charger plus', 'filters.label' => 'Filtres', 'filters.search' => 'Rechercher'] as $key => $french) {
            self::assertSame($french, $translator->trans($key, domain: 'rm_mnb'));
        }
        self::assertSame('Filtres, 1 filtre actif', $translator->trans('filters.label_active', ['%count%' => 1], 'rm_mnb'));
        self::assertSame('Filtres, 3 filtres actifs', $translator->trans('filters.label_active', ['%count%' => 3], 'rm_mnb'));
    }

    #[Test]
    public function it_should_refuse_to_boot_without_twig_component(): void
    {
        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot use MobileNavigationBundle without symfony/ux-twig-component.');

        self::bootKernel(['environment' => 'no_twig_component']);
    }
}
