<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use MertAydin\SystemMonitor\Http\Controllers\DashboardController;
use MertAydin\SystemMonitor\Http\Middleware\AuthorizeDashboard;

Route::group([
    'prefix' => trim(config('system-monitor.path', 'system-monitor'), '/'),
    // Session-backed preferences and CSRF protection require the web middleware,
    // even when an application overrides the package's additional middleware.
    'middleware' => array_values(array_unique(array_merge(
        ['web'],
        (array) config('system-monitor.middleware', ['auth']),
        [AuthorizeDashboard::class],
    ))),
    'as' => 'system-monitor.',
], function (): void {
    Route::get('/', DashboardController::class)
        ->name('index')
        ->middleware('throttle:30,1');

    Route::post('/refresh-interval', function (Request $request) {
        $validated = $request->validate([
            'interval' => ['required', 'integer', 'in:0,15,30,60,300,600'],
        ]);

        $request->session()->put('system-monitor.refresh_interval', (int) $validated['interval']);

        return response()->json(['interval' => (int) $validated['interval']]);
    })->name('refresh')->middleware('throttle:20,1');

    Route::post('/language', function (Request $request) {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:tr,en,ar,es,hi,zh_CN'],
        ]);

        $request->session()->put('system-monitor.locale', $validated['locale']);

        return redirect()->route('system-monitor.index');
    })->name('language')->middleware('throttle:10,1');
});
