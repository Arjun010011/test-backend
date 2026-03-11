<?php

use App\Services\JavaCodingProblemProviderService;
use App\Services\JavascriptCodingProblemProviderService;
use App\Services\MultiLanguageCodingProblemProviderService;
use App\Services\PythonCodingProblemProviderService;
use Illuminate\Support\Facades\Storage;

it('loads Java coding problems from the configured datasets disk', function () {
    config()->set('datasets.disk', 's3');
    config()->set('datasets.paths.coding.java', 'datasets/java_coding_problem_bank.json');

    Storage::fake('s3');

    Storage::disk('s3')->put('datasets/java_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'class Solution {}',
                'runner_source' => 'public class Main {}',
            ],
            [
                'id' => 2,
                'slug' => 'three-sum',
                'title' => 'Three Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'medium',
                'starter_code' => 'class Solution {}',
                'runner_source' => 'public class Main {}',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    $service = app(JavaCodingProblemProviderService::class);

    expect($service->getAvailableTopics())->toBe([
        'arrays_hashmap' => 'Arrays + HashMap',
    ]);

    $problems = $service->generateProblemsFromBlueprint([
        [
            'topic' => 'arrays_hashmap',
            'easy_count' => 1,
            'medium_count' => 1,
            'hard_count' => 0,
        ],
    ]);

    expect($problems)->toHaveCount(2)
        ->and(collect($problems)->pluck('topic_key')->unique()->values()->all())->toBe(['arrays_hashmap'])
        ->and(collect($problems)->pluck('difficulty')->sort()->values()->all())->toBe(['easy', 'medium']);
});

it('loads Python coding problems from the configured datasets disk', function () {
    config()->set('datasets.disk', 's3');
    config()->set('datasets.paths.coding.python', 'datasets/python_coding_problem_bank.json');

    Storage::fake('s3');

    Storage::disk('s3')->put('datasets/python_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'def solve(): pass',
                'runner_source' => 'print(\"ok\")',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    $service = app(PythonCodingProblemProviderService::class);

    expect($service->getAvailableTopics())->toBe([
        'arrays_hashmap' => 'Arrays + HashMap',
    ]);
});

it('loads JavaScript coding problems from the configured datasets disk', function () {
    config()->set('datasets.disk', 's3');
    config()->set('datasets.paths.coding.javascript', 'datasets/javascript_coding_problem_bank.json');

    Storage::fake('s3');

    Storage::disk('s3')->put('datasets/javascript_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'export function solve() {}',
                'runner_source' => 'console.log(\"ok\")',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    $service = app(JavascriptCodingProblemProviderService::class);

    expect($service->getAvailableTopics())->toBe([
        'arrays_hashmap' => 'Arrays + HashMap',
    ]);
});

it('merges language variants for coding problems by slug', function () {
    config()->set('datasets.disk', 's3');
    config()->set('datasets.paths.coding.java', 'datasets/java_coding_problem_bank.json');
    config()->set('datasets.paths.coding.python', 'datasets/python_coding_problem_bank.json');
    config()->set('datasets.paths.coding.javascript', 'datasets/javascript_coding_problem_bank.json');

    Storage::fake('s3');

    Storage::disk('s3')->put('datasets/java_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'class Solution { }',
                'runner_source' => 'public class Main { }',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    Storage::disk('s3')->put('datasets/python_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'def solve(): pass',
                'runner_source' => 'print(\"ok\")',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    Storage::disk('s3')->put('datasets/javascript_coding_problem_bank.json', json_encode([
        'problems' => [
            [
                'id' => 1,
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'topic_key' => 'arrays_hashmap',
                'topic_label' => 'Arrays + HashMap',
                'difficulty' => 'easy',
                'starter_code' => 'export function solve() {}',
                'runner_source' => 'console.log(\"ok\")',
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    $service = app(MultiLanguageCodingProblemProviderService::class);

    $problems = $service->generateProblemsFromBlueprint([
        [
            'topic' => 'arrays_hashmap',
            'easy_count' => 1,
            'medium_count' => 0,
            'hard_count' => 0,
        ],
    ]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toHaveKey('language_variants')
        ->and($problems[0])->not->toHaveKey('starter_code')
        ->and($problems[0])->not->toHaveKey('runner_source')
        ->and(array_keys($problems[0]['language_variants']))->toBe(['java', 'python', 'javascript']);
});

it('throws a helpful exception when the dataset file is missing', function () {
    config()->set('datasets.disk', 's3');
    config()->set('datasets.paths.coding.java', 'datasets/missing.json');

    Storage::fake('s3');

    $service = app(JavaCodingProblemProviderService::class);

    expect(fn () => $service->getAvailableTopics())
        ->toThrow(InvalidArgumentException::class, 'Java coding dataset file was not found.');
});
