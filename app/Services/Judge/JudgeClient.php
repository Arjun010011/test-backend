<?php

namespace App\Services\Judge;

interface JudgeClient
{
    /**
     * @param  array<int, array{id:int, stdin:?string, expected_stdout:string, is_sample:bool}>  $testCases
     * @return array{
     *   verdict:string,
     *   compile_output:?string,
     *   case_results:array<int, array{
     *     id:int,
     *     is_sample:bool,
     *     verdict:string,
     *     passed:bool,
     *     runtime_ms:int,
     *     stdout_preview:string,
     *     stderr_preview:string
     *   }>,
     *   sample_passed_count:int,
     *   sample_total_count:int,
     *   hidden_passed_count:int,
     *   hidden_total_count:int
     * }
     */
    public function run(
        string $language,
        string $sourceCode,
        string $runnerSource,
        array $testCases,
        int $timeLimitMs,
        int $memoryLimitMb,
    ): array;
}
