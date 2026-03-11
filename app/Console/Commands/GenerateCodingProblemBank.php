<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class GenerateCodingProblemBank extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'datasets:generate-coding-bank
        {--count=20 : Problems per topic per difficulty}
        {--disk= : Storage disk to write to (defaults to config(datasets.disk))}
        {--java-path= : Override Java dataset path (defaults to config(datasets.paths.coding.java))}
        {--python-path= : Override Python dataset path (defaults to config(datasets.paths.coding.python))}
        {--javascript-path= : Override JavaScript dataset path (defaults to config(datasets.paths.coding.javascript))}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a multi-language coding problem bank and write it to storage (e.g. S3).';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = max(1, (int) $this->option('count'));

        $disk = (string) ($this->option('disk') ?: config('datasets.disk', 'datasets'));

        $javaPath = (string) ($this->option('java-path') ?: config('datasets.paths.coding.java', 'datasets/java_coding_problem_bank.json'));
        $pythonPath = (string) ($this->option('python-path') ?: config('datasets.paths.coding.python', 'datasets/python_coding_problem_bank.json'));
        $javascriptPath = (string) ($this->option('javascript-path') ?: config('datasets.paths.coding.javascript', 'datasets/javascript_coding_problem_bank.json'));

        $generator = new \App\Services\Datasets\CodingProblemBankGenerator;
        $banks = $generator->generate(countPerTopicPerDifficulty: $count);

        $payload = [
            'java' => [
                'path' => $javaPath,
                'problems' => $banks['java'] ?? [],
            ],
            'python' => [
                'path' => $pythonPath,
                'problems' => $banks['python'] ?? [],
            ],
            'javascript' => [
                'path' => $javascriptPath,
                'problems' => $banks['javascript'] ?? [],
            ],
        ];

        foreach ($payload as $language => $entry) {
            $path = (string) ($entry['path'] ?? '');
            $problems = is_array($entry['problems'] ?? null) ? (array) ($entry['problems'] ?? []) : [];

            if ($path === '') {
                $this->error("Missing output path for {$language}.");

                return self::FAILURE;
            }

            Storage::disk($disk)->put($path, json_encode([
                'problems' => array_values($problems),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

            $this->info("Wrote {$language} problem bank ({$count} per topic per difficulty) to [{$disk}:{$path}].");
        }

        return self::SUCCESS;
    }
}
