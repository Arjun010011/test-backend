<?php

namespace App\Services\Judge;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class LocalJudgeClient implements JudgeClient
{
    public function run(
        string $language,
        string $sourceCode,
        string $runnerSource,
        array $testCases,
        int $timeLimitMs,
        int $memoryLimitMb,
    ): array {
        $languageKey = strtolower(trim($language));

        return match ($languageKey) {
            'python' => $this->runPython($sourceCode, $runnerSource, $testCases, $timeLimitMs),
            'javascript', 'js' => $this->runJavascript($sourceCode, $runnerSource, $testCases, $timeLimitMs, $memoryLimitMb),
            default => $this->runJava($sourceCode, $runnerSource, $testCases, $timeLimitMs, $memoryLimitMb),
        };
    }

    /**
     * @param  array<int, array{id:int, stdin:?string, expected_stdout:string, is_sample:bool}>  $testCases
     * @return array<string, mixed>
     */
    private function runJava(
        string $sourceCode,
        string $runnerSource,
        array $testCases,
        int $timeLimitMs,
        int $memoryLimitMb,
    ): array {
        $workDir = $this->makeWorkspace();

        try {
            file_put_contents($workDir.'/Solution.java', $sourceCode);
            file_put_contents($workDir.'/Runner.java', $runnerSource);

            $compile = new Process(['javac', 'Runner.java', 'Solution.java'], $workDir);
            $compile->setTimeout(6.0);
            $compile->run();

            if (! $compile->isSuccessful()) {
                $compileOutput = trim($compile->getErrorOutput()."\n".$compile->getOutput());

                return [
                    'verdict' => 'CE',
                    'compile_output' => Str::limit($compileOutput, 8000, '...'),
                    'case_results' => [],
                    'sample_passed_count' => 0,
                    'sample_total_count' => (int) collect($testCases)->where('is_sample', true)->count(),
                    'hidden_passed_count' => 0,
                    'hidden_total_count' => (int) collect($testCases)->where('is_sample', false)->count(),
                ];
            }

            return $this->runTestCases(
                $testCases,
                fn (string $stdin) => new Process(
                    ['java', '-Xmx'.max(16, $memoryLimitMb).'m', '-cp', $workDir, 'Runner'],
                    $workDir,
                    null,
                    $stdin,
                    null,
                ),
                $timeLimitMs,
            );
        } finally {
            File::deleteDirectory($workDir);
        }
    }

    /**
     * @param  array<int, array{id:int, stdin:?string, expected_stdout:string, is_sample:bool}>  $testCases
     * @return array<string, mixed>
     */
    private function runPython(
        string $sourceCode,
        string $runnerSource,
        array $testCases,
        int $timeLimitMs,
    ): array {
        $workDir = $this->makeWorkspace();

        try {
            file_put_contents($workDir.'/Solution.py', $sourceCode);
            file_put_contents($workDir.'/Runner.py', $runnerSource);

            return $this->runTestCases(
                $testCases,
                fn (string $stdin) => new Process(
                    ['python3', 'Runner.py'],
                    $workDir,
                    null,
                    $stdin,
                    null,
                ),
                $timeLimitMs,
            );
        } finally {
            File::deleteDirectory($workDir);
        }
    }

    /**
     * @param  array<int, array{id:int, stdin:?string, expected_stdout:string, is_sample:bool}>  $testCases
     * @return array<string, mixed>
     */
    private function runJavascript(
        string $sourceCode,
        string $runnerSource,
        array $testCases,
        int $timeLimitMs,
        int $memoryLimitMb,
    ): array {
        $workDir = $this->makeWorkspace();

        try {
            file_put_contents($workDir.'/Solution.js', $sourceCode);
            file_put_contents($workDir.'/Runner.js', $runnerSource);

            return $this->runTestCases(
                $testCases,
                fn (string $stdin) => new Process(
                    ['node', '--max-old-space-size='.max(16, $memoryLimitMb), 'Runner.js'],
                    $workDir,
                    null,
                    $stdin,
                    null,
                ),
                $timeLimitMs,
            );
        } finally {
            File::deleteDirectory($workDir);
        }
    }

    /**
     * @param  array<int, array{id:int, stdin:?string, expected_stdout:string, is_sample:bool}>  $testCases
     * @param  callable(string):Process  $processFactory
     * @return array<string, mixed>
     */
    private function runTestCases(
        array $testCases,
        callable $processFactory,
        int $timeLimitMs,
    ): array {
        $caseResults = [];
        $samplePassed = 0;
        $sampleTotal = 0;
        $hiddenPassed = 0;
        $hiddenTotal = 0;

        foreach ($testCases as $case) {
            $isSample = (bool) ($case['is_sample'] ?? false);

            if ($isSample) {
                $sampleTotal++;
            } else {
                $hiddenTotal++;
            }

            $stdin = (string) ($case['stdin'] ?? '');
            $expected = (string) ($case['expected_stdout'] ?? '');

            $process = $processFactory($stdin);
            $process->setTimeout(max(0.25, $timeLimitMs / 1000));

            $runtimeMs = 0;
            $stdout = '';
            $stderr = '';
            $verdict = 'RE';
            $passed = false;

            $startedAt = microtime(true);

            try {
                $process->run();
                $runtimeMs = (int) round((microtime(true) - $startedAt) * 1000);
                $stdout = $process->getOutput();
                $stderr = $process->getErrorOutput();

                if (! $process->isSuccessful()) {
                    $verdict = 'RE';
                    $passed = false;
                } else {
                    $normalizedActual = $this->normalizeOutput($stdout);
                    $normalizedExpected = $this->normalizeOutput($expected);
                    $passed = $normalizedActual === $normalizedExpected;
                    $verdict = $passed ? 'AC' : 'WA';
                }
            } catch (ProcessTimedOutException) {
                $runtimeMs = (int) round((microtime(true) - $startedAt) * 1000);
                $verdict = 'TLE';
                $passed = false;
            }

            if ($passed) {
                if ($isSample) {
                    $samplePassed++;
                } else {
                    $hiddenPassed++;
                }
            }

            $caseResults[] = [
                'id' => (int) ($case['id'] ?? 0),
                'is_sample' => $isSample,
                'verdict' => $verdict,
                'passed' => $passed,
                'runtime_ms' => $runtimeMs,
                'stdout_preview' => Str::limit($stdout, 2000, '...'),
                'stderr_preview' => Str::limit($stderr, 2000, '...'),
            ];
        }

        $overallVerdict = $hiddenTotal > 0 && $hiddenPassed === $hiddenTotal ? 'AC' : 'WA';

        return [
            'verdict' => $overallVerdict,
            'compile_output' => null,
            'case_results' => $caseResults,
            'sample_passed_count' => $samplePassed,
            'sample_total_count' => $sampleTotal,
            'hidden_passed_count' => $hiddenPassed,
            'hidden_total_count' => $hiddenTotal,
        ];
    }

    private function makeWorkspace(): string
    {
        $base = sys_get_temp_dir().'/judge';

        if (! is_dir($base)) {
            mkdir($base, 0770, true);
        }

        $dir = $base.'/'.Str::uuid()->toString();
        mkdir($dir, 0770, true);

        return $dir;
    }

    private function normalizeOutput(string $output): string
    {
        $normalized = str_replace("\r\n", "\n", $output);

        return trim($normalized);
    }
}
