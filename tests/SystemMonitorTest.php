<?php

namespace MertAydin\SystemMonitor\Tests;

use MertAydin\SystemMonitor\SystemMonitor;
use Orchestra\Testbench\TestCase;

class SystemMonitorTest extends TestCase
{

    public function test_authorization_is_allowed_by_default_when_no_callback_is_registered(): void
    {
        $monitor = new SystemMonitor();

        $this->assertTrue($monitor->allows(Request::create('/system-monitor')));
    }

    public function test_authorization_callback_can_allow_or_deny_a_request(): void
    {
        $request = Request::create('/system-monitor');
        $monitor = new SystemMonitor();

        $monitor->auth(fn (Request $request) => $request->path() === 'system-monitor');

        $this->assertTrue($monitor->allows($request));

        $monitor->auth(fn () => false);

        $this->assertFalse($monitor->allows($request));
    }

    public function test_it_returns_the_configured_collector_sections(): void
    {
        config([
            'system-monitor.cache.enabled' => false,
            'system-monitor.collectors.server' => false,
            'system-monitor.collectors.php' => false,
            'system-monitor.collectors.laravel' => false,
            'system-monitor.collectors.database' => false,
            'system-monitor.collectors.security' => false,
        ]);

        $snapshot = (new SystemMonitor())->collect();

        $this->assertArrayHasKey('collected_at', $snapshot);
        $this->assertSame([], $snapshot['server']);
        $this->assertSame([], $snapshot['php']);
        $this->assertSame([], $snapshot['laravel']);
        $this->assertSame([], $snapshot['database']);
        $this->assertSame([], $snapshot['security']);
    }

    public function test_dashboard_translations_are_available_in_all_supported_locales(): void
    {
        foreach (['en', 'tr', 'ar', 'es', 'hi', 'zh_CN'] as $locale) {
            $this->assertNotEmpty(trans('system-monitor::messages.customize', [], $locale));
            $this->assertNotEmpty(trans('system-monitor::messages.light', [], $locale));
        }
    }

    public function test_it_collects_php_runtime_information(): void
    {
        config([
            'system-monitor.cache.enabled' => false,
            'system-monitor.collectors.server' => false,
            'system-monitor.collectors.php' => true,
            'system-monitor.collectors.laravel' => false,
            'system-monitor.collectors.database' => false,
            'system-monitor.collectors.security' => false,
        ]);

        $snapshot = (new SystemMonitor())->collect();

        $this->assertSame(PHP_VERSION, $snapshot['php']['version']);
        $this->assertArrayHasKey('memory_limit', $snapshot['php']);
        $this->assertArrayHasKey('extensions', $snapshot['php']);
    }
}