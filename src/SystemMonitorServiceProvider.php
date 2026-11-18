<?php

namespace MertAydin\\SystemMonitor;

use Illuminate\\Support\\ServiceProvider;

class SystemMonitorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/system-monitor.php', 'system-monitor');
        $this->app->singleton(SystemMonitor::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'system-monitor');
        $this->loadTranslationsFrom(__DIR__.'/../lang', 'system-monitor');

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/system-monitor.php' => config_path('system-monitor.php'),
            ], 'system-monitor-config');

            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/system-monitor'),
            ], 'system-monitor-views');

            $this->publishes([
                __DIR__.'/../public' => public_path('vendor/system-monitor'),
            ], 'system-monitor-assets');

            $this->publishes([
                __DIR__.'/../lang' => lang_path('vendor/system-monitor'),
            ], 'system-monitor-translations');
        }
    }
}
