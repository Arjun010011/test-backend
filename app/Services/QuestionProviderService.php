<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use InvalidArgumentException;

class QuestionProviderService
{
    /**
     * @var array<int, array<string, mixed>>|null
     */
    private ?array $datasetQuestions = null;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function generateQuestions(string $category, string $difficulty, int $count = 10): array
    {
        $difficultyCounts = [
            'easy_count' => 0,
            'medium_count' => 0,
            'hard_count' => 0,
        ];

        if ($difficulty === 'mixed') {
            $base = intdiv($count, 3);
            $remainder = $count % 3;

            $difficultyCounts = [
                'easy_count' => $base,
                'medium_count' => $base,
                'hard_count' => $base,
            ];

            if ($remainder > 0) {
                $difficultyCounts['easy_count']++;
            }

            if ($remainder > 1) {
                $difficultyCounts['medium_count']++;
            }
        } else {
            $difficultyCounts[$difficulty.'_count'] = $count;
        }

        return $this->generateQuestionsFromBlueprint([
            [
                'topic' => $category,
                ...$difficultyCounts,
            ],
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function getAvailableTopics(): array
    {
        return $this->datasetCollection()
            ->mapWithKeys(fn (array $question): array => [
                (string) $question['topic_key'] => (string) $question['topic_label'],
            ])
            ->sortBy(fn (string $label): string => $label)
            ->all();
    }

    /**
     * @return array<string, string>
     */
    public function getAvailableCategories(): array
    {
        return $this->getAvailableTopics();
    }

    /**
     * @param  array<int, array{topic:string, easy_count:int, medium_count:int, hard_count:int}>  $questionBlueprint
     * @return array<int, array<string, mixed>>
     */
    public function generateQuestionsFromBlueprint(array $questionBlueprint): array
    {
        $availableTopics = $this->getAvailableTopics();
        $selectedQuestions = collect();

        foreach ($questionBlueprint as $selection) {
            $topic = (string) Arr::get($selection, 'topic');

            if (! array_key_exists($topic, $availableTopics)) {
                throw new InvalidArgumentException('Selected topic is not available in the aptitude dataset.');
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

                $pool = $this->datasetCollection()
                    ->where('topic_key', $topic)
                    ->where('difficulty', $difficulty)
                    ->values();

                if ($pool->count() < $requestedCount) {
                    throw new InvalidArgumentException(sprintf(
                        'Not enough %s questions for topic "%s". Requested %d, available %d.',
                        $difficulty,
                        $availableTopics[$topic],
                        $requestedCount,
                        $pool->count(),
                    ));
                }

                $selectedQuestions = $selectedQuestions->concat($pool->shuffle()->take($requestedCount)->values());
            }
        }

        return $selectedQuestions
            ->shuffle()
            ->values()
            ->map(fn (array $question): array => [
                'question_text' => $question['question_text'],
                'question_type' => 'multiple_choice',
                'category' => $question['topic_key'],
                'difficulty' => $question['difficulty'],
                'points' => $this->pointsByDifficulty($question['difficulty']),
                'explanation' => $question['explanation'],
                'source' => 'cs_aptitude_dataset',
                'metadata' => [
                    'topic_label' => $question['topic_label'],
                    'dataset_source_file' => $question['source_file'],
                    'dataset_question_id' => $question['source_question_id'],
                ],
                'options' => $question['options'],
            ])
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function datasetCollection(): Collection
    {
        if ($this->datasetQuestions !== null) {
            return collect($this->datasetQuestions);
        }

        $path = storage_path('app/datasets/cs_engineering_aptitude_240.json');

        if (! File::exists($path)) {
            throw new InvalidArgumentException('Aptitude dataset file was not found.');
        }

        /** @var array{questions:array<int, array<string, mixed>>}|null $payload */
        $payload = json_decode((string) File::get($path), true);

        if (! is_array($payload) || ! isset($payload['questions']) || ! is_array($payload['questions'])) {
            throw new InvalidArgumentException('Aptitude dataset file is invalid.');
        }

        $rawQuestions = collect($payload['questions'])
            ->map(function (array $item): array {
                $topicLabel = $this->cleanTopicLabel((string) Arr::get($item, 'category', 'General'));
                $topicKey = $this->topicKey((string) Arr::get($item, 'category', 'general'));
                $difficulty = $this->normalizeDifficulty((string) Arr::get($item, 'difficulty', 'easy'));

                return [
                    'source_question_id' => (int) Arr::get($item, 'id', 0),
                    'source_file' => (string) Arr::get($item, 'source_file', ''),
                    'topic_label' => $topicLabel,
                    'topic_key' => $topicKey,
                    'difficulty' => $difficulty,
                    'question_text' => trim((string) Arr::get($item, 'question', '')),
                    'answer' => trim((string) Arr::get($item, 'answer', '')),
                    'solution' => trim((string) Arr::get($item, 'solution', '')),
                    'raw_options' => Arr::get($item, 'options', []),
                ];
            })
            ->filter(fn (array $item): bool => $item['question_text'] !== '' && $item['answer'] !== '')
            ->values();

        $answerPoolByTopicAndDifficulty = $rawQuestions
            ->groupBy(fn (array $item): string => $item['topic_key'].'|'.$item['difficulty'])
            ->map(function (Collection $group): array {
                return $group
                    ->pluck('answer')
                    ->map(fn (string $answer): string => $this->cleanAnswerText($answer))
                    ->filter(fn (string $answer): bool => $answer !== '')
                    ->unique()
                    ->values()
                    ->all();
            });

        $globalAnswerPool = $rawQuestions
            ->pluck('answer')
            ->map(fn (string $answer): string => $this->cleanAnswerText($answer))
            ->filter(fn (string $answer): bool => $answer !== '')
            ->unique()
            ->values()
            ->all();

        $this->datasetQuestions = $rawQuestions
            ->map(function (array $item) use ($answerPoolByTopicAndDifficulty, $globalAnswerPool): ?array {
                $options = $this->buildOptions(
                    $item['raw_options'],
                    $item['answer'],
                    $answerPoolByTopicAndDifficulty->get($item['topic_key'].'|'.$item['difficulty'], []),
                    $globalAnswerPool,
                );

                if (count($options) < 2) {
                    return null;
                }

                return [
                    'source_question_id' => $item['source_question_id'],
                    'source_file' => $item['source_file'],
                    'topic_label' => $item['topic_label'],
                    'topic_key' => $item['topic_key'],
                    'difficulty' => $item['difficulty'],
                    'question_text' => $item['question_text'],
                    'explanation' => $item['solution'],
                    'options' => $options,
                ];
            })
            ->filter()
            ->values()
            ->all();

        return collect($this->datasetQuestions);
    }

    private function topicKey(string $rawCategory): string
    {
        $normalized = preg_replace('/^\d+\s*/', '', $rawCategory) ?? $rawCategory;

        return Str::of($normalized)
            ->replace(['(', ')'], '')
            ->replace('-', ' ')
            ->lower()
            ->slug('_')
            ->toString();
    }

    private function cleanTopicLabel(string $rawCategory): string
    {
        $normalized = preg_replace('/^\d+\s*/', '', $rawCategory) ?? $rawCategory;

        return trim($normalized);
    }

    private function normalizeDifficulty(string $rawDifficulty): string
    {
        $value = Str::lower($rawDifficulty);

        return match (true) {
            Str::contains($value, 'basic') || $value === 'easy' => 'easy',
            Str::contains($value, 'intermediate') || $value === 'medium' => 'medium',
            Str::contains($value, 'advance') || Str::contains($value, 'advanced') || $value === 'hard' => 'hard',
            default => 'easy',
        };
    }

    /**
     * @param  array<int, string>  $topicDifficultyAnswers
     * @param  array<int, string>  $globalAnswers
     * @return array<int, array{option_text:string, is_correct:bool}>
     */
    private function buildOptions(mixed $rawOptions, string $answer, array $topicDifficultyAnswers, array $globalAnswers): array
    {
        $cleanAnswer = $this->cleanAnswerText($answer);

        /** @var array<int, array{label:string, text:string}> $providedOptions */
        $providedOptions = collect(is_array($rawOptions) ? $rawOptions : [])
            ->map(function (mixed $option): ?array {
                if (! is_array($option)) {
                    return null;
                }

                $label = Str::upper(trim((string) Arr::get($option, 'label', '')));
                $text = trim((string) Arr::get($option, 'text', ''));

                if ($label === '' || $text === '') {
                    return null;
                }

                return [
                    'label' => $label,
                    'text' => $text,
                ];
            })
            ->filter()
            ->values()
            ->all();

        if (count($providedOptions) >= 2) {
            $answerLabel = null;

            if (preg_match('/^([A-H])\)/i', trim($answer), $matches) === 1) {
                $answerLabel = Str::upper($matches[1]);
            }

            return collect($providedOptions)
                ->map(function (array $option) use ($cleanAnswer, $answerLabel): array {
                    $isCorrectByLabel = $answerLabel !== null && $option['label'] === $answerLabel;
                    $isCorrectByText = $answerLabel === null && $this->normalizeString($option['text']) === $this->normalizeString($cleanAnswer);

                    return [
                        'option_text' => $option['text'],
                        'is_correct' => $isCorrectByLabel || $isCorrectByText,
                    ];
                })
                ->pipe(function (Collection $options) use ($cleanAnswer): Collection {
                    if ($options->contains('is_correct', true)) {
                        return $options;
                    }

                    $fallbackIndex = $options
                        ->search(fn (array $option): bool => Str::contains(
                            $this->normalizeString($option['option_text']),
                            $this->normalizeString($cleanAnswer),
                        ));

                    if ($fallbackIndex !== false) {
                        $options[$fallbackIndex]['is_correct'] = true;

                        return $options;
                    }

                    $options[0]['is_correct'] = true;

                    return $options;
                })
                ->values()
                ->all();
        }

        if ($cleanAnswer === '') {
            return [];
        }

        $distractors = collect($topicDifficultyAnswers)
            ->merge($globalAnswers)
            ->filter(fn (string $item): bool => $this->normalizeString($item) !== $this->normalizeString($cleanAnswer))
            ->unique()
            ->shuffle()
            ->take(3)
            ->values()
            ->all();

        while (count($distractors) < 3) {
            $distractors[] = 'Option '.chr(65 + count($distractors));
        }

        return collect(array_merge([$cleanAnswer], $distractors))
            ->shuffle()
            ->map(fn (string $text): array => [
                'option_text' => $text,
                'is_correct' => $this->normalizeString($text) === $this->normalizeString($cleanAnswer),
            ])
            ->values()
            ->all();
    }

    private function cleanAnswerText(string $answer): string
    {
        $value = trim($answer);
        $value = preg_replace('/^\s*(?:option\s*)?([A-H])[\)\.\:\-]\s*/i', '', $value) ?? $value;

        if (preg_match('/^\s*([A-H])\s*$/i', $value) === 1) {
            return strtoupper(trim($value));
        }

        return trim($value);
    }

    private function normalizeString(string $value): string
    {
        $normalized = Str::of($value)
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/i', ' ')
            ->squish()
            ->toString();

        return trim($normalized);
    }

    private function pointsByDifficulty(string $difficulty): int
    {
        return match ($difficulty) {
            'easy' => 1,
            'medium' => 2,
            'hard' => 3,
            default => 1,
        };
    }
}
