<?php

namespace MertAydin\SystemMonitor;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemMonitor
{
    protected ?Closure $authorizationCallback = null;

    /**
     * Register a callback that decides who may access the dashboard.
     */
    public function auth(callable $callback): static
    {
        $this->authorizationCallback = Closure::fromCallable($callback);

        return $this;
    }

    /**
     * Determine whether the given request may access the dashboard.
     */
    public function allows(Request $request): bool
    {
        // System metrics and runtime configuration are sensitive operational data.
        return $this->authorizationCallback !== null
            && (bool) ($this->authorizationCallback)($request);
    }

    public function collect(bool $forceRefresh = false): array
    {
        $callback = fn () => [
            'collected_at' => now()->toIso8601String(),
            'server' => config('system-monitor.collectors.server') ? $this->server() : [],
            'php' => config('system-monitor.collectors.php') ? $this->php() : [],
            'laravel' => config('system-monitor.collectors.laravel') ? $this->laravel() : [],
            'database' => config('system-monitor.collectors.database') ? $this->database() : [],
            'cache_queue' => config('system-monitor.collectors.cache_queue') ? $this->cacheQueue() : [],
            'security' => config('system-monitor.collectors.security') ? $this->security() : [],
        ];

        if ($forceRefresh || ! config('system-monitor.cache.enabled', true)) {
            return $callback();
        }

        $store = config('system-monitor.cache.store');
        $cache = $store ? Cache::store($store) : Cache::store();

        return $cache->remember('system-monitor.snapshot', now()->addSeconds((int) config('system-monitor.cache.ttl', 15)), $callback);
    }

    protected function server(): array
    {
        $memory = [];
        if (is_readable('/proc/meminfo')) {
            foreach (file('/proc/meminfo', FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                if (preg_match('/^(MemTotal|MemAvailable|SwapTotal|SwapFree):\\s+(\\d+)/', $line, $m)) {
                    $memory[$m[1]] = (int) $m[2] * 1024;
                }
            }
        }

        $total = $memory['MemTotal'] ?? null;
        $available = $memory['MemAvailable'] ?? null;
        $diskTotal = @disk_total_space(base_path());
        $diskFree = @disk_free_space(base_path());
        $load = function_exists('sys_getloadavg') ? sys_getloadavg() : false;

        return [
            'hostname' => gethostname() ?: 'Unknown',
            'os' => PHP_OS_FAMILY,
            'uptime_seconds' => $this->uptime(),
            'cpu_cores' => $this->cpuCores(),
            'load_average' => $load ?: null,
            'memory' => [
                'total' => $total,
                'available' => $available,
                'used' => $total !== null && $available !== null ? $total - $available : null,
                'percent' => $total && $available !== null ? round((($total - $available) / $total) * 100, 1) : null,
                'swap_total' => $memory['SwapTotal'] ?? null,
                'swap_free' => $memory['SwapFree'] ?? null,
            ],
            'disk' => [
                'total' => $diskTotal ?: null,
                'free' => $diskFree ?: null,
                'used' => $diskTotal && $diskFree !== false ? $diskTotal - $diskFree : null,
                'percent' => $diskTotal && $diskFree !== false ? round((($diskTotal - $diskFree) / $diskTotal) * 100, 1) : null,
            ],
        ];
    }

    protected function uptime(): ?int
    {
        if (! is_readable('/proc/uptime')) {
            return null;
        }

        $value = file_get_contents('/proc/uptime');

        return $value !== false ? (int) floor((float) strtok($value, ' ')) : null;
    }

    protected function cpuCores(): ?int
    {
        if (is_readable('/proc/cpuinfo')) {
            $count = preg_match_all('/^processor\\s*:/m', file_get_contents('/proc/cpuinfo') ?: '');

            if ($count > 0) {
                return $count;
            }
        }

        return null;
    }

    protected function php(): array
    {
        return [
            'version' => PHP_VERSION,
            'sapi' => PHP_SAPI,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'opcache_enabled' => function_exists('opcache_get_status') && @opcache_get_status(false) !== false,
            'extensions' => [
                'curl' => extension_loaded('curl'),
                'mbstring' => extension_loaded('mbstring'),
                'openssl' => extension_loaded('openssl'),
                'pdo' => extension_loaded('pdo'),
                'redis' => extension_loaded('redis'),
            ],
        ];
    }

    protected function laravel(): array
    {
        return [
            'version' => app()->version(),
            'environment' => app()->environment(),
            'debug' => (bool) config('app.debug'),
            'maintenance' => app()->isDownForMaintenance(),
            'timezone' => config('app.timezone'),
            'storage_writable' => is_writable(storage_path()),
            'cache_writable' => is_writable(storage_path('framework/cache')),
            'logs_writable' => is_writable(storage_path('logs')),
        ];
    }

    protected function database(): array
    {
        try {
            $started = microtime(true);
            DB::connection()->select('SELECT 1');

            return [
                'status' => 'connected',
                'driver' => DB::connection()->getDriverName(),
                'database' => DB::connection()->getDatabaseName(),
                'latency_ms' => round((microtime(true) - $started) * 1000, 2),
            ];
        } catch (\Throwable $exception) {
            report($exception);

            return [
                'status' => 'error',
                'driver' => config('database.default'),
                'database' => null,
                'latency_ms' => null,
                'message' => 'Database connection failed. Check the application log.',
            ];
        }
    }

    protected function cacheQueue(): array
    {
        $cacheDriver = config('cache.default');
        try {
            Cache::store()->get('__laravel_system_monitor_health_probe__');
            $cache = ['driver' => $cacheDriver, 'status' => 'connected'];
        } catch (\Throwable $exception) {
            report($exception);
            $cache = ['driver' => $cacheDriver, 'status' => 'error'];
        }

        $queueConnection = config('queue.default');
        $queueDriver = config('queue.connections.'.$queueConnection.'.driver');
        $queue = [
            'connection' => $queueConnection,
            'driver' => $queueDriver,
            'pending_jobs' => null,
            'failed_jobs' => null,
        ];

        try {
            if ($queueDriver === 'database') {
                $jobsTable = config('queue.connections.'.$queueConnection.'.table', 'jobs');
                if (Schema::hasTable($jobsTable)) {
                    $queue['pending_jobs'] = DB::table($jobsTable)->count();
                }
            }

            if (Schema::hasTable('failed_jobs')) {
                $queue['failed_jobs'] = DB::table('failed_jobs')->count();
            }
        } catch (\Throwable $exception) {
            report($exception);
            $queue['status'] = 'unavailable';
        }

        return ['cache' => $cache, 'queue' => $queue];
    }

    protected function security(): array
    {
        return [
            'app_key_set' => filled(config('app.key')),
            'debug_enabled' => (bool) config('app.debug'),
            'production_debug_warning' => app()->environment('production') && (bool) config('app.debug'),
            'https_configured' => str_starts_with((string) config('app.url'), 'https://'),
        ];
    }
}
