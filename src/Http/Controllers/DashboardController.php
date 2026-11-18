<?php

namespace MertAydin\SystemMonitor\Http\Controllers;

use Illuminate\Routing\Controller;
use MertAydin\SystemMonitor\SystemMonitor;

class DashboardController extends Controller
{
    public function __invoke(\Illuminate\Http\Request $request, SystemMonitor $monitor)
    {
        abort_unless(config('system-monitor.enabled', true), 404);

        $locale = session('system-monitor.locale', app()->getLocale());
        $locale = in_array($locale, ['tr', 'en', 'ar', 'es', 'hi', 'zh_CN'], true) ? $locale : 'en';

        app()->setLocale($locale);

        return view('system-monitor::dashboard', [
            'snapshot' => $monitor->collect($request->boolean('refresh')),
            'title' => config('system-monitor.title', 'System Monitor'),
            'monitorLocale' => $locale,
            'refreshInterval' => (int) $request->session()->get('system-monitor.refresh_interval', 60),
        ]);
    }
}
