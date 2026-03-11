<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class MultiLanguageCodingProblemProviderService
{
    public function __construct(
        public JavaCodingProblemProviderService $javaBank,
        public PythonCodingProblemProviderService $pythonBank,
        public JavascriptCodingProblemProviderService $javascriptBank,
    ) {}

    /**
     * @return array<string, string>
     */
    public function getAvailableTopics(): array
    {
        return $this->javaBank->getAvailableTopics();
    }

    /**
     * Returns a merged multi-language problem entry per selected slug.
     *
     * @param  array<int, array{topic:string, easy_count:int, medium_count:int, hard_count:int}>  $questionBlueprint
     * @return array<int, array<string, mixed>>
     */
    public function generateProblemsFromBlueprint(array $questionBlueprint): array
    {
        $javaSelected = $this->javaBank->generateProblemsFromBlueprint($questionBlueprint);

        $pythonBySlug = $this->indexBySlug((string) config('datasets.paths.coding.python', 'datasets/python_coding_problem_bank.json'));
        $javascriptBySlug = $this->indexBySlug((string) config('datasets.paths.coding.javascript', 'datasets/javascript_coding_problem_bank.json'));

        return collect($javaSelected)
            ->map(function (array $javaProblem) use ($pythonBySlug, $javascriptBySlug): array {
                $slug = (string) ($javaProblem['slug'] ?? '');

                if ($slug === '') {
                    throw new InvalidArgumentException('Coding problem slug is missing.');
                }

                $python = $pythonBySlug[$slug] ?? null;
                $javascript = $javascriptBySlug[$slug] ?? null;

                $languages = collect([
                    'java' => $javaProblem,
                    'python' => $python,
                    'javascript' => $javascript,
                ])
                    ->filter(fn ($value): bool => is_array($value))
                    ->mapWithKeys(fn (array $problem, string $language): array => [
                        $language => [
                            'starter_code' => (string) ($problem['starter_code'] ?? ''),
                            'runner_source' => (string) ($problem['runner_source'] ?? ''),
                        ],
                    ])
                    ->all();

                if (! array_key_exists('java', $languages)) {
                    throw new InvalidArgumentException('Java variant missing for coding problem.');
                }

                return [
                    ...Arr::except($javaProblem, ['starter_code', 'runner_source']),
                    'language_variants' => $languages,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function indexBySlug(string $path): array
    {
        $disk = (string) config('datasets.disk', 'datasets');

        if (! Storage::disk($disk)->exists($path)) {
            return [];
        }

        /** @var array{problems:array<int, array<string, mixed>>}|null $payload */
        $payload = json_decode((string) Storage::disk($disk)->get($path), true);

        if (! is_array($payload) || ! isset($payload['problems']) || ! is_array($payload['problems'])) {
            return [];
        }

        return collect($payload['problems'])
            ->filter(fn (array $problem): bool => (string) ($problem['slug'] ?? '') !== '')
            ->mapWithKeys(fn (array $problem): array => [(string) $problem['slug'] => $problem])
            ->all();
    }
}
