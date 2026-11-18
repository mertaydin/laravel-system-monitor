<?php

namespace MertAydin\SystemMonitor\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static $this auth(callable $callback)
 *
 * @see \MertAydin\SystemMonitor\SystemMonitor
 */
class SystemMonitor extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \MertAydin\SystemMonitor\SystemMonitor::class;
    }
}
