<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class SheetFormRowTest extends ComponentTestCase
{
    #[Test]
    public function it_should_post_without_confirmation(): void
    {
        $form = $this->renderComponent('SheetFormRow', ['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'])->filter('form.rm-mnb-sheet-form');

        self::assertSame('post', $form->attr('method'));
        self::assertSame('/loans/1/finish', $form->attr('action'));
        self::assertNull($form->attr('data-controller'));
        self::assertSame('csrf', $form->filter('input[name="_token"]')->attr('value'));
        $row = $form->filter('button.rm-mnb-row');
        self::assertSame('submit', $row->attr('type'));
        self::assertSame('Finish', $row->filter('.rm-mnb-row__label')->text());
    }

    #[Test]
    public function it_should_confirm_before_posting(): void
    {
        $form = $this->renderComponent('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'confirm' => ['title' => 'Finish', 'message' => 'Finish this loan?']])->filter('form');

        self::assertSame(self::PREFIX.'confirm-submit', $form->attr('data-controller'));
        self::assertSame('Finish this loan?', $form->attr('data-'.self::PREFIX.'confirm-submit-message-value'));
        self::assertSame('Finish', $form->attr('data-'.self::PREFIX.'confirm-submit-confirm-label-value'));
    }

    #[Test]
    public function it_should_render_its_hidden_fields_chip_and_ink(): void
    {
        $form = $this->renderComponent('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'fields' => ['status' => 'done', 'step' => 2], 'icon' => 'icon-check', 'tone' => 'xyz', 'danger' => true])->filter('form');

        self::assertSame('done', $form->filter('input[name="status"]')->attr('value'));
        self::assertSame('2', $form->filter('input[name="step"]')->attr('value'));
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $form->filter('.rm-mnb-chip')->attr('class'));
        self::assertStringContainsString('rm-mnb-row--danger', (string) $form->filter('.rm-mnb-row')->attr('class'));
    }

    #[Test]
    public function it_should_refuse_a_field_that_is_not_scalar_or_replaces_the_token(): void
    {
        $this->assertMountFails('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'fields' => ['ids' => [1, 2]]], 'Cannot mount the "ids" field of the MobileNavigation:SheetFormRow component.');
        $this->assertMountFails('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'fields' => ['_token' => 'forged']], 'Cannot mount the "_token" field');
        $this->assertMountFails('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'confirm' => ['title' => 'Finish']], 'Cannot mount the "confirm" prop');
    }

    #[Test]
    public function it_should_require_action(): void
    {
        $data = ['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'];
        unset($data['action']);
        $this->assertMountFails('SheetFormRow', $data, 'There is no "action" prop for the MobileNavigation:SheetFormRow component.');
        $this->assertMountFails('SheetFormRow', [...$data, 'action' => null], 'There is no "action" prop for the MobileNavigation:SheetFormRow component.');
    }

    #[Test]
    public function it_should_require_token(): void
    {
        $data = ['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'];
        unset($data['token']);
        $this->assertMountFails('SheetFormRow', $data, 'There is no "token" prop for the MobileNavigation:SheetFormRow component.');
        $this->assertMountFails('SheetFormRow', [...$data, 'token' => null], 'There is no "token" prop for the MobileNavigation:SheetFormRow component.');
    }

    #[Test]
    public function it_should_require_label(): void
    {
        $data = ['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'];
        unset($data['label']);
        $this->assertMountFails('SheetFormRow', $data, 'There is no "label" prop for the MobileNavigation:SheetFormRow component.');
        $this->assertMountFails('SheetFormRow', [...$data, 'label' => null], 'There is no "label" prop for the MobileNavigation:SheetFormRow component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('SheetFormRow', [...['action' => '/loans/1/finish', 'token' => 'csrf', 'label' => 'Finish'], 'role' => 'note', 'data-foo' => 'bar'])->filter('form');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
