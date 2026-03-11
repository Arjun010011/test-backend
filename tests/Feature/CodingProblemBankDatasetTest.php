<?php

use Illuminate\Support\Facades\File;

test('coding problem banks have required shape and match across languages', function () {
    $loadProblemBank = function (string $path): array {
        $payload = json_decode((string) File::get($path), true);

        expect($payload)->toBeArray();
        expect($payload)->toHaveKey('problems');
        expect($payload['problems'])->toBeArray();

        return $payload;
    };

    $java = $loadProblemBank(storage_path('app/datasets/java_coding_problem_bank.json'));
    $python = $loadProblemBank(storage_path('app/datasets/python_coding_problem_bank.json'));
    $javascript = $loadProblemBank(storage_path('app/datasets/javascript_coding_problem_bank.json'));

    $javaBySlug = collect($java['problems'])->keyBy('slug');
    $pythonBySlug = collect($python['problems'])->keyBy('slug');
    $javascriptBySlug = collect($javascript['problems'])->keyBy('slug');

    expect($javaBySlug)->not->toBeEmpty();
    expect($javaBySlug->keys()->all())->toEqualCanonicalizing($pythonBySlug->keys()->all());
    expect($javaBySlug->keys()->all())->toEqualCanonicalizing($javascriptBySlug->keys()->all());

    $topicLabelsByKey = [];

    foreach ($javaBySlug as $slug => $javaProblem) {
        expect($javaProblem)->toBeArray();
        expect($javaProblem)->toHaveKeys([
            'id',
            'slug',
            'title',
            'topic_key',
            'topic_label',
            'difficulty',
            'time_limit_ms',
            'memory_limit_mb',
            'statement_md',
            'starter_code',
            'runner_source',
            'sample_cases',
            'hidden_cases',
        ]);

        expect($javaProblem['slug'])->toBe($slug);
        expect($javaProblem['id'])->toBeInt();
        expect($javaProblem['title'])->toBeString()->not->toBeEmpty();
        expect($javaProblem['topic_key'])->toBeString()->not->toBeEmpty();
        expect($javaProblem['topic_label'])->toBeString()->not->toBeEmpty();
        expect($javaProblem['difficulty'])->toBeIn(['easy', 'medium', 'hard']);
        expect($javaProblem['time_limit_ms'])->toBeInt();
        expect($javaProblem['memory_limit_mb'])->toBeInt();
        expect($javaProblem['statement_md'])->toBeString()->not->toBeEmpty();
        expect($javaProblem['starter_code'])->toBeString()->not->toBeEmpty();
        expect($javaProblem['runner_source'])->toBeString()->not->toBeEmpty();

        expect($javaProblem['sample_cases'])->toBeArray()->and(count($javaProblem['sample_cases']))->toBe(3);
        expect($javaProblem['hidden_cases'])->toBeArray()->and(count($javaProblem['hidden_cases']))->toBeGreaterThanOrEqual(2);

        $topicKey = (string) $javaProblem['topic_key'];
        $topicLabel = (string) $javaProblem['topic_label'];

        if (array_key_exists($topicKey, $topicLabelsByKey)) {
            expect($topicLabelsByKey[$topicKey])->toBe($topicLabel);
        } else {
            $topicLabelsByKey[$topicKey] = $topicLabel;
        }

        $pythonProblem = $pythonBySlug->get($slug);
        $javascriptProblem = $javascriptBySlug->get($slug);

        expect($pythonProblem)->toBeArray();
        expect($javascriptProblem)->toBeArray();

        expect($pythonProblem['topic_key'])->toBe($javaProblem['topic_key']);
        expect($pythonProblem['difficulty'])->toBe($javaProblem['difficulty']);
        expect($javascriptProblem['topic_key'])->toBe($javaProblem['topic_key']);
        expect($javascriptProblem['difficulty'])->toBe($javaProblem['difficulty']);

        $javaSample = collect($javaProblem['sample_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all();

        $javaHidden = collect($javaProblem['hidden_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all();

        expect(collect($pythonProblem['sample_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all())->toBe($javaSample);

        expect(collect($pythonProblem['hidden_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all())->toBe($javaHidden);

        expect(collect($javascriptProblem['sample_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all())->toBe($javaSample);

        expect(collect($javascriptProblem['hidden_cases'])->map(fn (array $case): array => [
            'stdin' => (string) ($case['stdin'] ?? ''),
            'expected_stdout' => (string) ($case['expected_stdout'] ?? ''),
            'points' => (int) ($case['points'] ?? 0),
        ])->all())->toBe($javaHidden);
    }
});
