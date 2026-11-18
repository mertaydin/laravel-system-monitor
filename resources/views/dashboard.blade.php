<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>{{ $title }}</title>
    <link rel="stylesheet" href="{{ asset('vendor/system-monitor/system-monitor.css') }}">
</head>
<body class="sm-body">
<div class="sm-wrap" data-system-monitor>
    @php
        $server = $snapshot['server'] ?? [];
        $memory = $server['memory'] ?? [];
        $disk = $server['disk'] ?? [];
        $php = $snapshot['php'] ?? [];
        $laravel = $snapshot['laravel'] ?? [];
        $database = $snapshot['database'] ?? [];
        $cache = $snapshot['cache_queue']['cache'] ?? [];
        $queue = $snapshot['cache_queue']['queue'] ?? [];
        $security = $snapshot['security'] ?? [];
        $fmt = fn ($bytes) => $bytes === null ? 'N/A' : number_format($bytes / 1073741824, 2).' GB';
        $healthOk = ($database['status'] ?? '') === 'connected' && ($cache['status'] ?? '') === 'connected' && !($security['production_debug_warning'] ?? false);
        $pctClass = fn ($v) => $v === null ? '' : ($v >= 90 ? 'sm-bad' : ($v >= 75 ? 'sm-warn' : 'sm-good'));
        $load = $server['load_average'] ?? null;
        $widgets = [
            'cpu' => 'CPU',
            'memory' => 'Memory',
            'disk' => 'Disk',
            'uptime' => 'Uptime',
            'php' => 'PHP runtime',
            'laravel' => 'Laravel',
            'database' => 'Database',
            'cache' => 'Cache',
            'queue' => 'Queue',
            'storage' => 'Storage',
            'debug' => 'Debug mode',
            'https' => 'HTTPS',
        ];
    @endphp
    <header class="sm-header">
        <div class="sm-brand"><div class="sm-logo">⌁</div><div><h1>{{ $title }}</h1><div class="sm-subtitle">Server health · Application overview</div></div></div>
        <div class="sm-actions"><span class="sm-updated">Last checked {{ $snapshot['collected_at'] }}</span><button type="button" class="sm-button" data-sm-open>⚙ Customize</button></div>
    </header>
    <section class="sm-overview" aria-label="System overview">
        <article class="sm-hero">
            <div class="sm-kicker"><span>OVERALL HEALTH</span><span>{{ $server['hostname'] ?? 'Application server' }}</span></div>
            <div class="sm-health"><span class="sm-health-dot"></span>{{ $healthOk ? 'All systems operational' : 'Check required' }}</div>
            <div class="sm-muted">{{ $healthOk ? 'Core application services are responding normally.' : 'One or more health checks need your attention.' }}</div>
        </article>
        @foreach ([
            ['title' => 'Memory', 'value' => $memory['percent'] ?? null, 'foot' => $fmt($memory['used'] ?? null).' / '.$fmt($memory['total'] ?? null)],
            ['title' => 'Disk', 'value' => $disk['percent'] ?? null, 'foot' => $fmt($disk['free'] ?? null).' free'],
            ['title' => 'CPU load', 'value' => isset($load[0], $server['cpu_cores']) && $server['cpu_cores'] ? min(100, round($load[0] / $server['cpu_cores'] * 100)) : null, 'foot' => $load ? 'Load '.implode(' · ', array_map(fn($v) => number_format($v, 2), $load)) : 'Load unavailable'],
        ] as $gauge)
            <article class="sm-gauge"><div class="sm-gauge-title">{{ $gauge['title'] }}</div><div class="sm-gauge-ring" style="--pct:{{ $gauge['value'] ?? 0 }}%"><strong>{{ $gauge['value'] === null ? '—' : $gauge['value'].'%' }}</strong></div><div class="sm-gauge-foot">{{ $gauge['foot'] }}</div></article>
        @endforeach
    </section>
    <div class="sm-section"><h2>System & application metrics</h2><span>Drag cards to rearrange · Customize to hide or show</span></div>
    <section class="sm-grid" aria-label="System metrics">
        <article class="sm-card" data-widget="cpu" data-title="CPU"><div class="sm-card-head">CPU cores <i class="sm-card-dot"></i></div><div class="sm-value">{{ $server['cpu_cores'] ?? 'N/A' }}</div><div class="sm-meta">Load average: {{ $load ? implode(' / ', array_map(fn($v)=>number_format($v,2), $load)) : 'N/A' }}</div></article>
        <article class="sm-card" data-widget="memory" data-title="Memory"><div class="sm-card-head">Memory usage <i class="sm-card-dot {{ $pctClass($memory['percent'] ?? null) }}"></i></div><div class="sm-value {{ $pctClass($memory['percent'] ?? null) }}">{{ isset($memory['percent']) ? $memory['percent'].'%' : 'N/A' }}</div><div class="sm-meta">{{ $fmt($memory['used'] ?? null) }} used / {{ $fmt($memory['total'] ?? null) }}</div></article>
        <article class="sm-card" data-widget="disk" data-title="Disk"><div class="sm-card-head">Disk usage <i class="sm-card-dot {{ $pctClass($disk['percent'] ?? null) }}"></i></div><div class="sm-value {{ $pctClass($disk['percent'] ?? null) }}">{{ isset($disk['percent']) ? $disk['percent'].'%' : 'N/A' }}</div><div class="sm-meta">{{ $fmt($disk['free'] ?? null) }} free / {{ $fmt($disk['total'] ?? null) }}</div></article>
        <article class="sm-card" data-widget="uptime" data-title="Uptime"><div class="sm-card-head">Server uptime <i class="sm-card-dot"></i></div><div class="sm-value">{{ isset($server['uptime_seconds']) ? floor($server['uptime_seconds']/86400).'d '.floor(($server['uptime_seconds']%86400)/3600).'h' : 'N/A' }}</div><div class="sm-meta">{{ $server['os'] ?? 'OS unavailable' }}</div></article>
        <article class="sm-card" data-widget="php" data-title="PHP runtime"><div class="sm-card-head">PHP runtime <i class="sm-card-dot"></i></div><div class="sm-value">{{ $php['version'] ?? 'N/A' }}</div><div class="sm-meta">{{ $php['sapi'] ?? '' }} · Memory {{ $php['memory_limit'] ?? 'N/A' }}</div></article>
        <article class="sm-card" data-widget="laravel" data-title="Laravel"><div class="sm-card-head">Laravel framework <i class="sm-card-dot"></i></div><div class="sm-value sm-good">{{ $laravel['version'] ?? 'N/A' }}</div><div class="sm-meta">{{ $laravel['environment'] ?? 'Environment unknown' }} · {{ ($laravel['maintenance'] ?? false) ? 'Maintenance' : 'Available' }}</div></article>
        <article class="sm-card" data-widget="database" data-title="Database"><div class="sm-card-head">Database <i class="sm-card-dot {{ ($database['status'] ?? '') === 'connected' ? '' : 'bad' }}"></i></div><div class="sm-value {{ ($database['status'] ?? '') === 'connected' ? 'sm-good' : 'sm-bad' }}">{{ ucfirst($database['status'] ?? 'Unknown') }}</div><div class="sm-meta">{{ $database['driver'] ?? 'Driver unavailable' }} · {{ isset($database['latency_ms']) ? $database['latency_ms'].' ms' : 'Latency N/A' }}</div></article>
        <article class="sm-card" data-widget="cache" data-title="Cache"><div class="sm-card-head">Cache store <i class="sm-card-dot {{ ($cache['status'] ?? '') === 'connected' ? '' : 'bad' }}"></i></div><div class="sm-value {{ ($cache['status'] ?? '') === 'connected' ? 'sm-good' : 'sm-bad' }}">{{ ucfirst($cache['status'] ?? 'Unknown') }}</div><div class="sm-meta">{{ $cache['driver'] ?? 'Driver unavailable' }}</div></article>
        <article class="sm-card" data-widget="queue" data-title="Queue"><div class="sm-card-head">Queue connection <i class="sm-card-dot"></i></div><div class="sm-value">{{ $queue['driver'] ?? 'N/A' }}</div><div class="sm-meta">Pending: {{ $queue['pending_jobs'] ?? 'N/A' }} · Failed: {{ $queue['failed_jobs'] ?? 'N/A' }}</div></article>
        <article class="sm-card" data-widget="storage" data-title="Storage"><div class="sm-card-head">Storage permissions <i class="sm-card-dot {{ ($laravel['storage_writable'] ?? false) ? '' : 'bad' }}"></i></div><div class="sm-value {{ ($laravel['storage_writable'] ?? false) ? 'sm-good' : 'sm-bad' }}">{{ ($laravel['storage_writable'] ?? false) ? 'Writable' : 'Not writable' }}</div><div class="sm-meta">Application storage directory</div></article>
        <article class="sm-card" data-widget="debug" data-title="Debug mode"><div class="sm-card-head">Debug mode <i class="sm-card-dot {{ ($security['production_debug_warning'] ?? false) ? 'bad' : '' }}"></i></div><div class="sm-value {{ ($security['production_debug_warning'] ?? false) ? 'sm-bad' : 'sm-good' }}">{{ ($security['debug_enabled'] ?? false) ? 'Enabled' : 'Disabled' }}</div><div class="sm-meta">{{ ($security['production_debug_warning'] ?? false) ? 'Debug is enabled in production' : 'Application debug setting' }}</div></article>
        <article class="sm-card" data-widget="https" data-title="HTTPS"><div class="sm-card-head">HTTPS configuration <i class="sm-card-dot {{ ($security['https_configured'] ?? false) ? '' : 'warn' }}"></i></div><div class="sm-value {{ ($security['https_configured'] ?? false) ? 'sm-good' : 'sm-warn' }}">{{ ($security['https_configured'] ?? false) ? 'Configured' : 'Review' }}</div><div class="sm-meta">Based on APP_URL</div></article>
    </section>
    <footer class="sm-footer"><span>Laravel System Monitor · Read-only diagnostics</span><span>Preferences are saved in this browser</span></footer>
    <div class="sm-settings" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Customize dashboard">
        <div class="sm-settings-panel"><div class="sm-settings-head"><h2>Customize dashboard</h2><button class="sm-button" type="button" data-sm-close aria-label="Close">✕</button></div><p class="sm-settings-help">Choose which cards are visible. Drag cards on the dashboard to change their order. Your preferences are stored in this browser.</p><div data-sm-options></div><div class="sm-settings-foot"><button class="sm-button" type="button" data-sm-reset>Reset layout</button><button class="sm-button" type="button" data-sm-close>Done</button></div></div>
    </div>
</div>
<script src="{{ asset('vendor/system-monitor/system-monitor.js') }}" defer></script>
</body>
</html>