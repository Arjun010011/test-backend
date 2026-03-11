<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class PythonCodingProblemProviderService
{
    /**
     * @var array<int, array<string, mixed>>|null
     */
    private ?array $problems = null;

    /**
     * @return array<string, string>
     */
    public function getAvailableTopics(): array
    {
        return $this->problemCollection()
            ->mapWithKeys(fn (array $problem): array => [
                (string) $problem['topic_key'] => (string) $problem['topic_label'],
            ])
            ->sortBy(fn (string $label): string => $label)
            ->all();
    }

    /**
     * @param  array<int, array{topic:string, easy_count:int, medium_count:int, hard_count:int}>  $questionBlueprint
     * @return array<int, array<string, mixed>>
     */
    public function generateProblemsFromBlueprint(array $questionBlueprint): array
    {
        $availableTopics = $this->getAvailableTopics();
        $selectedProblems = collect();

        foreach ($questionBlueprint as $selection) {
            $topic = (string) Arr::get($selection, 'topic');

            if (! array_key_exists($topic, $availableTopics)) {
                throw new InvalidArgumentException('Selected topic is not available in the Python coding dataset.');
            }

            $requestedCounts = [
                'easy' => max(0, (int) Arr::get($selection, 'easy_count', 0)),
                'medium' => max(0, (int) Arr::get($selection, 'medium_count', 0)),
                'hard' => max(0, (int) Arr::get($selection, 'hard_count', 0)),
            ];

            foreach ($requestedCounts as $difficulty => $requestedCount) {
                if ($requestedCount === 0) {
                    continue;
                }

                $pool = $this->problemCollection()
                    ->where('topic_key', $topic)
                    ->where('difficulty', $difficulty)
                    ->values();

                if ($pool->count() < $requestedCount) {
                    throw new InvalidArgumentException(sprintf(
                        'Not enough %s problems for topic "%s". Requested %d, available %d.',
                        $difficulty,
                        $availableTopics[$topic],
                        $requestedCount,
                        $pool->count(),
                    ));
                }

                $selectedProblems = $selectedProblems->concat($pool->shuffle()->take($requestedCount)->values());
            }
        }

        return $selectedProblems
            ->shuffle()
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function problemCollection(): Collection
    {
        if ($this->problems !== null) {
            return collect($this->problems);
        }

        $disk = (string) config('datasets.disk', 'datasets');
        $path = (string) config('datasets.paths.coding.python', 'datasets/python_coding_problem_bank.json');

        if (! Storage::disk($disk)->exists($path)) {
            throw new InvalidArgumentException('Python coding dataset file was not found.');
        }

        /** @var array{problems:array<int, array<string, mixed>>}|null $payload */
        $payload = json_decode((string) Storage::disk($disk)->get($path), true);

        if (! is_array($payload) || ! isset($payload['problems']) || ! is_array($payload['problems'])) {
            throw new InvalidArgumentException('Python coding dataset file is invalid.');
        }

        $this->problems = collect($payload['problems'])
            ->map(fn (array $problem): array => [
                'id' => (int) ($problem['id'] ?? 0),
                'slug' => (string) ($problem['slug'] ?? ''),
                'title' => (string) ($problem['title'] ?? ''),
                'topic_key' => (string) ($problem['topic_key'] ?? 'general'),
                'topic_label' => (string) ($problem['topic_label'] ?? 'General'),
                'difficulty' => (string) ($problem['difficulty'] ?? 'easy'),
                'time_limit_ms' => (int) ($problem['time_limit_ms'] ?? 2000),
                'memory_limit_mb' => (int) ($problem['memory_limit_mb'] ?? 256),
                'statement_md' => (string) ($problem['statement_md'] ?? ''),
                'starter_code' => (string) ($problem['starter_code'] ?? ''),
                'runner_source' => (string) ($problem['runner_source'] ?? ''),
                'sample_cases' => $problem['sample_cases'] ?? [],
                'hidden_cases' => $problem['hidden_cases'] ?? [],
            ])
            ->filter(fn (array $problem): bool => $problem['slug'] !== '' && $problem['title'] !== '')
            ->values()
            ->all();

        return collect($this->problems);
    }
}
