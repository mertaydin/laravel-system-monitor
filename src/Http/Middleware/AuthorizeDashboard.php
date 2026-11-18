<?php

namespace MertAydin\SystemMonitor\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MertAydin\SystemMonitor\SystemMonitor;

class AuthorizeDashboard
{
    public function handle(Request $request, Closure $next, SystemMonitor $monitor)
    {
        abort_unless($monitor->allows($request), 403);

        return $next($request);
    }
}
