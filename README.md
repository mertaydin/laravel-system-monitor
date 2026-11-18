# Laravel System Monitor

A lightweight, extensible system health and resource monitoring dashboard for Laravel applications.

## Requirements

- PHP 8.2+
- Laravel 10, 11, 12 or 13

## Installation

```bash
composer require mertaydin/laravel-system-monitor
php artisan vendor:publish --tag=system-monitor-config
```

The package registers its service provider automatically.

## Access

By default the dashboard is available at `/system-monitor` and uses Laravel's `web` and `auth` middleware.

Configure access in `config/system-monitor.php`:

```php
'middleware' => ['web', 'auth'],
'path' => 'system-monitor',
```

For applications with a different authentication setup, replace the middleware with the appropriate authorization middleware. Do not expose the dashboard publicly.

## Current metrics

- Server hostname, OS family, uptime, CPU core count and load average
- Linux memory and swap information when `/proc/meminfo` is available
- Disk capacity for the application filesystem
- PHP version, SAPI, limits, OPcache and selected extension availability
- Laravel version, environment, maintenance state and writable directories
- Database connectivity, driver and basic connection latency
- Basic security configuration checks (APP_KEY presence, debug mode and HTTPS APP_URL)

Some server metrics are platform-dependent. Unsupported values are returned as `null`; the package does not execute arbitrary shell commands.

## Configuration

The configuration file supports enabling/disabling collectors, changing the route, middleware, dashboard title and snapshot cache TTL.

## Security

The dashboard is protected by authentication middleware by default and rate limited. Keep it behind authentication and preferably an additional admin authorization rule or network restriction. The package does not display secrets or execute user-provided shell commands.

## License

MIT