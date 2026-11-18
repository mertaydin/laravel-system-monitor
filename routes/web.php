<?php

use Illuminate\\Support\\Facades\\Route;
use MertAydin\\SystemMonitor\\Http\\Controllers\\DashboardController;

Route::group([
    'prefix' => trim(config('system-monitor.path', 'system-monitor'), '/'),
    'middleware' => config('system-monitor.middleware', ['web', 'auth']),
    'as' => 'system-monitor.',
], function (): void {
    Route::get('/', DashboardController::class)
        ->name('index')
        ->middleware('throttle:30,1');
});