<?php

namespace App\Jobs;

use App\Models\AssessmentCodeSubmission;
use App\Models\AssessmentQuestionTestCase;
use App\Services\Judge\JudgeClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GradeAssessmentCodeSubmission implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public int $submissionId) {}

    /**
     * Execute the job.
     */
    public function handle(JudgeClient $judge): void
    {
        $submission = AssessmentCodeSubmission::query()
            ->with([
                'question.testCases',
                'attempt',
            ])
            ->find($this->submissionId);

        if ($submission === null) {
            return;
        }

        if ($submission->status === 'completed') {
            return;
        }

        $submission->forceFill(['status' => 'running'])->save();

        $question = $submission->question;
        $metadata = is_array($question?->metadata) ? $question->metadata : [];
        $variants = is_array($metadata['language_variants'] ?? null) ? (array) ($metadata['language_variants'] ?? []) : [];
        $legacyLanguage = strtolower((string) ($metadata['language'] ?? 'java'));
        $legacyRunner = (string) ($metadata['runner_source'] ?? '');

        if ($variants === [] && $legacyRunner !== '') {
            $variants = [
                $legacyLanguage => [
                    'runner_source' => $legacyRunner,
                ],
            ];
        }

        $language = strtolower(trim((string) $submission->language));
        $runnerSource = (string) (($variants[$language]['runner_source'] ?? '') ?: '');

        if ($question === null || $question->question_type !== 'coding' || trim($runnerSource) === '') {
            $submission->forceFill([
                'status' => 'failed',
                'verdict' => 'CE',
                'compile_output' => 'Runner source is missing for this coding question.',
            ])->save();

            return;
        }

        $testCases = $question->testCases
            ->sortBy('display_order')
            ->values()
            ->map(fn (AssessmentQuestionTestCase $case): array => [
                'id' => $case->id,
                'stdin' => $case->stdin,
                'expected_stdout' => $case->expected_stdout,
                'is_sample' => (bool) $case->is_sample,
            ])
            ->all();

        try {
            $result = $judge->run(
                language: $submission->language,
                sourceCode: $submission->source_code,
                runnerSource: $runnerSource,
                testCases: $testCases,
                timeLimitMs: (int) ($metadata['time_limit_ms'] ?? 2000),
                memoryLimitMb: (int) ($metadata['memory_limit_mb'] ?? 256),
            );
        } catch (\Throwable $exception) {
            $submission->forceFill([
                'status' => 'failed',
                'verdict' => 'RE',
                'compile_output' => 'Judge error: '.$exception->getMessage(),
            ])->save();

            return;
        }

        $caseResults = collect($result['case_results'] ?? [])
            ->map(function (array $case): array {
                $isSample = (bool) ($case['is_sample'] ?? false);

                return [
                    'id' => (int) ($case['id'] ?? 0),
                    'is_sample' => $isSample,
                    'verdict' => (string) ($case['verdict'] ?? 'RE'),
                    'passed' => (bool) ($case['passed'] ?? false),
                    'runtime_ms' => (int) ($case['runtime_ms'] ?? 0),
                    // Avoid leaking hidden case outputs.
                    'stdout_preview' => $isSample ? (string) ($case['stdout_preview'] ?? '') : '',
                    'stderr_preview' => $isSample ? (string) ($case['stderr_preview'] ?? '') : '',
                ];
            })
            ->values()
            ->all();

        $submission->forceFill([
            'status' => 'completed',
            'verdict' => (string) ($result['verdict'] ?? 'RE'),
            'compile_output' => $result['compile_output'] ?? null,
            'case_results' => $caseResults,
            'sample_passed_count' => (int) ($result['sample_passed_count'] ?? 0),
            'sample_total_count' => (int) ($result['sample_total_count'] ?? 0),
            'hidden_passed_count' => (int) ($result['hidden_passed_count'] ?? 0),
            'hidden_total_count' => (int) ($result['hidden_total_count'] ?? 0),
        ])->save();
    }
}
