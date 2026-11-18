<?php

use Illuminate\\Http\\Request;
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

    Route::post('/language', function (Request $request) {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:tr,en,ar,es,hi,zh_CN'],
        ]);

        $request->session()->put('system-monitor.locale', $validated['locale']);

        return redirect()->route('system-monitor.index');
    })->name('language')->middleware('throttle:10,1');
});
