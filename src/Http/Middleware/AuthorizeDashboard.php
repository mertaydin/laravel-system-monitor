<?php

namespace MertAydin\SystemMonitor\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use MertAydin\SystemMonitor\SystemMonitor;

class AuthorizeDashboard
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless(app(SystemMonitor::class)->allows($request), 403);

        return $next($request);
    }
}
