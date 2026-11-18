<?php

return [
    'enabled' => env('SYSTEM_MONITOR_ENABLED', true),
    'path' => env('SYSTEM_MONITOR_PATH', 'system-monitor'),
    'middleware' => ['web', 'auth'],
    'title' => env('SYSTEM_MONITOR_TITLE', 'System Monitor'),
    'cache' => [
        'enabled' => true,
        'store' => env('SYSTEM_MONITOR_CACHE_STORE'),
        'ttl' => 15,
    ],
    'collectors' => [
        'server' => true,
        'php' => true,
        'laravel' => true,
        'database' => true,
        'security' => true,
    ],
];