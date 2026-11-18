<?php

namespace MertAydin\SystemMonitor\Tests;

use MertAydin\SystemMonitor\SystemMonitor;
use Orchestra\Testbench\TestCase;

class SystemMonitorTest extends TestCase
{
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