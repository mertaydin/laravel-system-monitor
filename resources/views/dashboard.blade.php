<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    <style>
        :root{color-scheme:dark;--bg:#101214;--card:#181b1f;--border:#292e34;--text:#e7e9ed;--muted:#9299a3;--green:#79c477;--yellow:#e7c84b;--red:#e46d78}
        *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
        .wrap{max-width:1440px;margin:auto;padding:24px}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.top h1{font-size:22px;margin:0}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:18px;min-width:0}.card h2{font-size:13px;font-weight:600;color:#c6cbd2;margin:0 0 18px}.value{font-size:27px;font-weight:700;letter-spacing:-.5px}.good{color:var(--green)}.warn{color:var(--yellow)}.bad{color:var(--red)}.wide{grid-column:span 2}.meta{font-size:12px;color:var(--muted);margin-top:10px;overflow-wrap:anywhere}.section{font-size:15px;margin:24px 0 12px}
        @media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wide{grid-column:span 2}}@media(max-width:520px){.wrap{padding:14px}.grid{grid-template-columns:1fr}.wide{grid-column:span 1}}
    </style>
</head>
<body>
<div class="wrap">
    <header class="top"><div><h1>{{ $title }}</h1><div class="muted">System and application overview</div></div><div class="muted">Updated {{ $snapshot['collected_at'] }}</div></header>
    @php
        $server = $snapshot['server'] ?? [];
        $memory = $server['memory'] ?? [];
        $disk = $server['disk'] ?? [];
        $php = $snapshot['php'] ?? [];
        $laravel = $snapshot['laravel'] ?? [];
        $database = $snapshot['database'] ?? [];
        $fmt = fn ($bytes) => $bytes === null ? 'N/A' : number_format($bytes / 1073741824, 2).' GB';
        $pctClass = fn ($v) => $v === null ? '' : ($v >= 90 ? 'bad' : ($v >= 75 ? 'warn' : 'good'));
    @endphp
    <h2 class="section">Server resources</h2>
    <div class="grid">
        <article class="card"><h2>CPU cores</h2><div class="value">{{ $server['cpu_cores'] ?? 'N/A' }}</div><div class="meta">Load: {{ isset($server['load_average']) && $server['load_average'] ? implode(' / ', array_map(fn($v)=>number_format($v,2), $server['load_average'])) : 'N/A' }}</div></article>
        <article class="card"><h2>Memory</h2><div class="value {{ $pctClass($memory['percent'] ?? null) }}">{{ isset($memory['percent']) ? $memory['percent'].'%' : 'N/A' }}</div><div class="meta">{{ $fmt($memory['used'] ?? null) }} used / {{ $fmt($memory['total'] ?? null) }}</div></article>
        <article class="card"><h2>Disk</h2><div class="value {{ $pctClass($disk['percent'] ?? null) }}">{{ isset($disk['percent']) ? $disk['percent'].'%' : 'N/A' }}</div><div class="meta">{{ $fmt($disk['used'] ?? null) }} used / {{ $fmt($disk['total'] ?? null) }}</div></article>
        <article class="card"><h2>Uptime</h2><div class="value">{{ isset($server['uptime_seconds']) ? floor($server['uptime_seconds']/86400).'d '.floor(($server['uptime_seconds']%86400)/3600).'h' : 'N/A' }}</div><div class="meta">{{ $server['hostname'] ?? 'Unknown' }} · {{ $server['os'] ?? '' }}</div></article>
    </div>
    <h2 class="section">Runtime services</h2>
    <div class="grid">
        <article class="card"><h2>Cache</h2><div class="value {{ ($snapshot['cache_queue']['cache']['status'] ?? '') === 'connected' ? 'good' : 'bad' }}">{{ ucfirst($snapshot['cache_queue']['cache']['status'] ?? 'Unknown') }}</div><div class="meta">{{ $snapshot['cache_queue']['cache']['driver'] ?? 'Driver unavailable' }}</div></article>
        <article class="card"><h2>Queue</h2><div class="value">{{ $snapshot['cache_queue']['queue']['driver'] ?? 'Unknown' }}</div><div class="meta">Pending: {{ $snapshot['cache_queue']['queue']['pending_jobs'] ?? 'N/A' }} · Failed: {{ $snapshot['cache_queue']['queue']['failed_jobs'] ?? 'N/A' }}</div></article>
    </div>
    <h2 class="section">Application</h2>
    <div class="grid">
        <article class="card"><h2>Laravel</h2><div class="value good">{{ $laravel['version'] ?? 'N/A' }}</div><div class="meta">{{ $laravel['environment'] ?? '' }} · {{ ($laravel['maintenance'] ?? false) ? 'Maintenance mode' : 'Available' }}</div></article>
        <article class="card"><h2>PHP</h2><div class="value">{{ $php['version'] ?? 'N/A' }}</div><div class="meta">{{ $php['sapi'] ?? '' }} · Memory limit {{ $php['memory_limit'] ?? 'N/A' }}</div></article>
        <article class="card"><h2>Database</h2><div class="value {{ ($database['status'] ?? '') === 'connected' ? 'good' : 'bad' }}">{{ ucfirst($database['status'] ?? 'Unknown') }}</div><div class="meta">{{ $database['driver'] ?? '' }} · {{ isset($database['latency_ms']) ? $database['latency_ms'].' ms' : '' }}</div></article>
        <article class="card"><h2>Application mode</h2><div class="value {{ ($laravel['debug'] ?? false) && ($laravel['environment'] ?? '') === 'production' ? 'bad' : 'good' }}">{{ ($laravel['debug'] ?? false) ? 'Debug ON' : 'Debug OFF' }}</div><div class="meta">APP_KEY {{ ($snapshot['security']['app_key_set'] ?? false) ? 'configured' : 'missing' }}</div></article>
        <article class="card"><h2>Storage</h2><div class="value {{ ($laravel['storage_writable'] ?? false) ? 'good' : 'bad' }}">{{ ($laravel['storage_writable'] ?? false) ? 'Writable' : 'Not writable' }}</div><div class="meta">Storage directory permissions</div></article>
        <article class="card"><h2>HTTPS</h2><div class="value {{ ($snapshot['security']['https_configured'] ?? false) ? 'good' : 'warn' }}">{{ ($snapshot['security']['https_configured'] ?? false) ? 'Configured' : 'Not configured' }}</div><div class="meta">Based on APP_URL configuration</div></article>
    </div>
    <footer class="meta" style="margin-top:24px">Laravel System Monitor · Read-only monitoring</footer>
</div>
</body>
</html>