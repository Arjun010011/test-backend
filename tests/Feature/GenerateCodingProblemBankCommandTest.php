<?php

use Illuminate\Support\Facades\Storage;

it('generates coding problem banks with the requested per-topic per-difficulty counts', function () {
    Storage::fake('s3');

    $javaPath = 'datasets/java.json';
    $pythonPath = 'datasets/python.json';
    $javascriptPath = 'datasets/javascript.json';

    $this->artisan('datasets:generate-coding-bank', [
        '--count' => 2,
        '--disk' => 's3',
        '--java-path' => $javaPath,
        '--python-path' => $pythonPath,
        '--javascript-path' => $javascriptPath,
    ])->assertSuccessful();

    $java = json_decode(Storage::disk('s3')->get($javaPath), true, flags: JSON_THROW_ON_ERROR);
    $python = json_decode(Storage::disk('s3')->get($pythonPath), true, flags: JSON_THROW_ON_ERROR);
    $javascript = json_decode(Storage::disk('s3')->get($javascriptPath), true, flags: JSON_THROW_ON_ERROR);

    $expectedTotal = 11 * 3 * 2;

    expect($java['problems'])->toHaveCount($expectedTotal)
        ->and($python['problems'])->toHaveCount($expectedTotal)
        ->and($javascript['problems'])->toHaveCount($expectedTotal);

    $javaProblems = collect($java['problems']);

    $counts = $javaProblems
        ->groupBy(fn (array $p): string => $p['topic_key'].'|'.$p['difficulty'])
        ->map->count()
        ->all();

    foreach ($counts as $bucketCount) {
        expect($bucketCount)->toBe(2);
    }

    $first = $javaProblems->first();

    expect($first)->toHaveKey('id')
        ->and($first)->toHaveKey('slug')
        ->and($first)->toHaveKey('title')
        ->and($first)->toHaveKey('topic_key')
        ->and($first)->toHaveKey('topic_label')
        ->and($first)->toHaveKey('difficulty')
        ->and($first)->toHaveKey('time_limit_ms')
        ->and($first)->toHaveKey('memory_limit_mb')
        ->and($first)->toHaveKey('statement_md')
        ->and($first)->toHaveKey('starter_code')
        ->and($first)->toHaveKey('runner_source')
        ->and($first)->toHaveKey('sample_cases')
        ->and($first)->toHaveKey('hidden_cases')
        ->and($first['sample_cases'])->toHaveCount(3)
        ->and($first['starter_code'])->not->toBeEmpty()
        ->and($first['runner_source'])->not->toBeEmpty()
        ->and($first['statement_md'])->not->toBeEmpty();

    $javaSlugs = collect($java['problems'])->pluck('slug')->sort()->values()->all();
    $pythonSlugs = collect($python['problems'])->pluck('slug')->sort()->values()->all();
    $javascriptSlugs = collect($javascript['problems'])->pluck('slug')->sort()->values()->all();

    expect($pythonSlugs)->toBe($javaSlugs)
        ->and($javascriptSlugs)->toBe($javaSlugs);
});
