<?php

namespace MertAydin\SystemMonitor\Http\Controllers;

use Illuminate\Routing\Controller;
use MertAydin\SystemMonitor\SystemMonitor;

class DashboardController extends Controller
{
    public function __invoke(SystemMonitor $monitor)
    {
        abort_unless(config('system-monitor.enabled', true), 404);

        return view('system-monitor::dashboard', [
            'snapshot' => $monitor->collect(),
            'title' => config('system-monitor.title', 'System Monitor'),
        ]);
    }
}