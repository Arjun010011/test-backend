<?php

namespace App\Services\Datasets;

use Illuminate\Support\Str;

class CodingProblemBankGenerator
{
    /**
     * @return array{java:array<int, array<string, mixed>>, python:array<int, array<string, mixed>>, javascript:array<int, array<string, mixed>>}
     */
    public function generate(int $countPerTopicPerDifficulty = 20): array
    {
        $count = max(1, $countPerTopicPerDifficulty);

        $topics = $this->topics();
        $difficulties = ['easy', 'medium', 'hard'];

        $commonProblems = [];
        $id = 1;

        foreach ($topics as $topic) {
            foreach ($difficulties as $difficulty) {
                for ($i = 1; $i <= $count; $i++) {
                    $seed = $this->seed($topic['topic_key'], $difficulty, $i);

                    $cases = [];
                    for ($caseIndex = 1; $caseIndex <= 3; $caseIndex++) {
                        $caseSeed = $seed + ($caseIndex * 101);
                        $caseRng = new DeterministicRng($caseSeed);
                        $stdin = $this->buildStdin($topic['topic_key'], $difficulty, $caseRng);
                        $expected = $this->solveExpected($topic['topic_key'], $stdin);

                        $cases[] = [
                            'stdin' => $stdin,
                            'expected_stdout' => $expected,
                            'points' => 1,
                        ];
                    }

                    $hiddenCases = [];
                    for ($hiddenIndex = 1; $hiddenIndex <= 2; $hiddenIndex++) {
                        $caseSeed = $seed + ($hiddenIndex * 1009);
                        $caseRng = new DeterministicRng($caseSeed);
                        $stdin = $this->buildStdin($topic['topic_key'], $difficulty, $caseRng);
                        $expected = $this->solveExpected($topic['topic_key'], $stdin);

                        $hiddenCases[] = [
                            'stdin' => $stdin,
                            'expected_stdout' => $expected,
                            'points' => 1,
                        ];
                    }

                    $slug = Str::of($topic['topic_key'].'_'.$difficulty.'_'.str_pad((string) $i, 3, '0', STR_PAD_LEFT))
                        ->lower()
                        ->toString();

                    $commonProblems[] = [
                        'id' => $id++,
                        'slug' => $slug,
                        'title' => $this->title($topic['topic_label'], $difficulty, $i),
                        'topic_key' => $topic['topic_key'],
                        'topic_label' => $topic['topic_label'],
                        'difficulty' => $difficulty,
                        'time_limit_ms' => $this->timeLimitMs($difficulty),
                        'memory_limit_mb' => 256,
                        'statement_md' => $this->statement($topic['topic_key'], $topic['topic_label'], $difficulty),
                        'sample_cases' => $cases,
                        'hidden_cases' => $hiddenCases,
                    ];
                }
            }
        }

        return [
            'java' => $this->mapToLanguage($commonProblems, 'java'),
            'python' => $this->mapToLanguage($commonProblems, 'python'),
            'javascript' => $this->mapToLanguage($commonProblems, 'javascript'),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $commonProblems
     * @return array<int, array<string, mixed>>
     */
    private function mapToLanguage(array $commonProblems, string $language): array
    {
        [$starter, $runner] = match ($language) {
            'python' => [$this->pythonStarterCode(), $this->pythonRunnerSource()],
            'javascript' => [$this->javascriptStarterCode(), $this->javascriptRunnerSource()],
            default => [$this->javaStarterCode(), $this->javaRunnerSource()],
        };

        return collect($commonProblems)
            ->map(fn (array $problem): array => [
                ...$problem,
                'starter_code' => $starter,
                'runner_source' => $runner,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{topic_key:string, topic_label:string}>
     */
    private function topics(): array
    {
        return [
            ['topic_key' => 'arrays', 'topic_label' => 'Arrays'],
            ['topic_key' => 'hashmap', 'topic_label' => 'Hash Maps'],
            ['topic_key' => 'arrays_hashmap', 'topic_label' => 'Arrays + Hash Maps'],
            ['topic_key' => 'stack_queue', 'topic_label' => 'Stacks + Queues'],
            ['topic_key' => 'strings', 'topic_label' => 'Strings'],
            ['topic_key' => 'graphs', 'topic_label' => 'Graphs'],
            ['topic_key' => 'sorting_search', 'topic_label' => 'Sorting + Searching'],
            ['topic_key' => 'dynamic_programming', 'topic_label' => 'Dynamic Programming'],
            ['topic_key' => 'two_pointers', 'topic_label' => 'Two Pointers'],
            ['topic_key' => 'math', 'topic_label' => 'Math'],
            ['topic_key' => 'greedy', 'topic_label' => 'Greedy'],
        ];
    }

    private function title(string $topicLabel, string $difficulty, int $index): string
    {
        return sprintf('%s — %s #%d', $topicLabel, Str::title($difficulty), $index);
    }

    private function timeLimitMs(string $difficulty): int
    {
        return match ($difficulty) {
            'hard' => 2500,
            'medium' => 2000,
            default => 1500,
        };
    }

    private function seed(string $topicKey, string $difficulty, int $index): int
    {
        $raw = crc32($topicKey.'|'.$difficulty.'|'.$index);

        return (int) ($raw === 0 ? 1 : $raw);
    }

    private function statement(string $topicKey, string $topicLabel, string $difficulty): string
    {
        $constraints = match ($difficulty) {
            'hard' => '- Larger inputs; aim for an efficient solution.',
            'medium' => '- Moderate inputs; avoid unnecessary overhead.',
            default => '- Small inputs; focus on correctness.',
        };

        $body = match ($topicKey) {
            'arrays' => <<<'MD'
Given an integer array, output the sum of all elements.

**Input**
- Line 1: integer `n`
- Line 2: `n` integers

**Output**
- A single integer: the sum
MD,
            'hashmap' => <<<'MD'
Given an integer array, output the frequency of each value.

**Input**
- Line 1: integer `n`
- Line 2: `n` integers

**Output**
- For each distinct value (ascending), print a line: `value count`
MD,
            'arrays_hashmap' => <<<'MD'
Given an integer array and a target, find two distinct indices `i` and `j` such that `a[i] + a[j] = target`.

**Input**
- Line 1: integer `n`
- Line 2: `n` integers
- Line 3: integer `target`

**Output**
- Two integers: `i j` (0-based, `i < j`)
MD,
            'stack_queue' => <<<'MD'
Given a string of parentheses, determine if it is balanced.

**Input**
- Line 1: a string consisting only of `(` and `)`

**Output**
- `true` if balanced, otherwise `false`
MD,
            'strings' => <<<'MD'
Given a line of text, reverse the order of words.

**Input**
- Line 1: a line containing words separated by spaces

**Output**
- The words in reverse order, separated by a single space
MD,
            'graphs' => <<<'MD'
Given an undirected graph, output the number of connected components.

**Input**
- Line 1: two integers `n m` (nodes `0..n-1`, edges)
- Next `m` lines: two integers `u v`

**Output**
- A single integer: number of connected components
MD,
            'sorting_search' => <<<'MD'
Given a sorted array and a target value, output the index of the target or `-1` if not found.

**Input**
- Line 1: integer `n`
- Line 2: `n` integers (sorted ascending)
- Line 3: integer `target`

**Output**
- A single integer: the index or `-1`
MD,
            'dynamic_programming' => <<<'MD'
Compute the `n`th Fibonacci number modulo `1_000_000_007`.

**Input**
- Line 1: integer `n` (0-indexed, where `F(0)=0`, `F(1)=1`)

**Output**
- `F(n) mod 1_000_000_007`
MD,
            'two_pointers' => <<<'MD'
Given a sorted array and a target, determine if there exists a pair with sum equal to the target.

**Input**
- Line 1: integer `n`
- Line 2: `n` integers (sorted ascending)
- Line 3: integer `target`

**Output**
- `true` if such a pair exists, otherwise `false`
MD,
            'math' => <<<'MD'
Given two integers `a` and `b`, output their greatest common divisor (GCD).

**Input**
- Line 1: two integers `a b`

**Output**
- A single integer: `gcd(a, b)`
MD,
            'greedy' => <<<'MD'
Given an amount in cents, output the minimum number of coins needed using denominations `{1, 5, 10, 25}`.

**Input**
- Line 1: integer `amount`

**Output**
- A single integer: minimum coins
MD,
            default => <<<'MD'
Solve the problem as described by the input and output formats.
MD,
        };

        return <<<MD
# {$topicLabel}

{$body}

**Constraints**
{$constraints}

**Implementation**
- Implement `solve(input)` in the provided starter code.
MD;
    }

    private function buildStdin(string $topicKey, string $difficulty, DeterministicRng $rng): string
    {
        return match ($topicKey) {
            'arrays' => $this->stdinArraySum($difficulty, $rng),
            'hashmap' => $this->stdinFrequency($difficulty, $rng),
            'arrays_hashmap' => $this->stdinTwoSum($difficulty, $rng),
            'stack_queue' => $this->stdinParentheses($difficulty, $rng),
            'strings' => $this->stdinReverseWords($difficulty, $rng),
            'graphs' => $this->stdinGraphComponents($difficulty, $rng),
            'sorting_search' => $this->stdinBinarySearch($difficulty, $rng),
            'dynamic_programming' => $this->stdinFibonacci($difficulty, $rng),
            'two_pointers' => $this->stdinPairSum($difficulty, $rng),
            'math' => $this->stdinGcd($difficulty, $rng),
            'greedy' => $this->stdinCoinChange($difficulty, $rng),
            default => "0\n",
        };
    }

    private function solveExpected(string $topicKey, string $stdin): string
    {
        return match ($topicKey) {
            'arrays' => $this->expectedArraySum($stdin),
            'hashmap' => $this->expectedFrequency($stdin),
            'arrays_hashmap' => $this->expectedTwoSum($stdin),
            'stack_queue' => $this->expectedParentheses($stdin),
            'strings' => $this->expectedReverseWords($stdin),
            'graphs' => $this->expectedGraphComponents($stdin),
            'sorting_search' => $this->expectedBinarySearch($stdin),
            'dynamic_programming' => $this->expectedFibonacci($stdin),
            'two_pointers' => $this->expectedPairSum($stdin),
            'math' => $this->expectedGcd($stdin),
            'greedy' => $this->expectedCoinChange($stdin),
            default => '',
        };
    }

    private function javaStarterCode(): string
    {
        return <<<'JAVA'
import java.util.*;

class Solution {
    public String solve(String input) {
        // TODO: parse input and return the exact output
        return "";
    }
}
JAVA;
    }

    private function javaRunnerSource(): string
    {
        return <<<'JAVA'
import java.io.*;

public class Runner {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line).append("\n");
        }

        Solution sol = new Solution();
        String out = sol.solve(sb.toString());
        if (out == null) {
            out = "";
        }

        System.out.print(out.trim());
    }
}
JAVA;
    }

    private function pythonStarterCode(): string
    {
        return <<<'PY'
def solve(input: str) -> str:
    # TODO: parse input and return the exact output
    return ""
PY;
    }

    private function pythonRunnerSource(): string
    {
        return <<<'PY'
import sys
from Solution import solve  # type: ignore


def main() -> None:
    data = sys.stdin.read()
    out = solve(data)
    if out is None:
        out = ""
    sys.stdout.write(str(out).strip())


if __name__ == "__main__":
    main()
PY;
    }

    private function javascriptStarterCode(): string
    {
        return <<<'JS'
function solve(input) {
  // TODO: parse input and return the exact output
  return '';
}

module.exports = { solve };
JS;
    }

    private function javascriptRunnerSource(): string
    {
        return <<<'JS'
const fs = require('fs');
const { solve } = require('./Solution');

function main() {
  const input = fs.readFileSync(0, 'utf8');
  const out = solve(input);
  process.stdout.write(String(out ?? '').trim());
}

main();
JS;
    }

    private function stdinArraySum(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(80, 150),
            'medium' => $rng->int(30, 70),
            default => $rng->int(5, 25),
        };

        $values = [];
        for ($i = 0; $i < $n; $i++) {
            $values[] = $rng->int(-50, 50);
        }

        return $n."\n".implode(' ', $values)."\n";
    }

    private function expectedArraySum(string $stdin): string
    {
        [$n, $arr] = $this->parseNAndIntArray($stdin);

        return (string) array_sum(array_slice($arr, 0, $n));
    }

    private function stdinFrequency(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(120, 220),
            'medium' => $rng->int(60, 120),
            default => $rng->int(10, 40),
        };

        $values = [];
        $range = match ($difficulty) {
            'hard' => [0, 40],
            'medium' => [0, 25],
            default => [0, 12],
        };

        for ($i = 0; $i < $n; $i++) {
            $values[] = $rng->int($range[0], $range[1]);
        }

        return $n."\n".implode(' ', $values)."\n";
    }

    private function expectedFrequency(string $stdin): string
    {
        [$n, $arr] = $this->parseNAndIntArray($stdin);
        $counts = [];

        foreach (array_slice($arr, 0, $n) as $value) {
            $counts[$value] = ($counts[$value] ?? 0) + 1;
        }

        ksort($counts);

        return collect($counts)
            ->map(fn (int $count, int $value): string => $value.' '.$count)
            ->implode("\n");
    }

    private function stdinTwoSum(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(40, 70),
            'medium' => $rng->int(20, 40),
            default => $rng->int(6, 18),
        };

        $attempts = 0;

        while (true) {
            $attempts++;

            $arr = [];
            $used = [];
            while (count($arr) < $n) {
                $v = $rng->int(-60, 60);
                if (array_key_exists($v, $used)) {
                    continue;
                }
                $used[$v] = true;
                $arr[] = $v;
            }

            $i = $rng->int(0, $n - 2);
            $j = $rng->int($i + 1, $n - 1);
            $target = $arr[$i] + $arr[$j];

            $solutions = 0;
            for ($a = 0; $a < $n; $a++) {
                for ($b = $a + 1; $b < $n; $b++) {
                    if ($target === $arr[$a] + $arr[$b]) {
                        $solutions++;
                    }
                }
            }

            if ($solutions === 1) {
                return $n."\n".implode(' ', $arr)."\n".$target."\n";
            }

            if ($attempts >= 20) {
                return "4\n2 7 11 15\n9\n";
            }
        }
    }

    private function expectedTwoSum(string $stdin): string
    {
        $lines = preg_split('/\r?\n/', trim($stdin));
        $n = (int) trim((string) ($lines[0] ?? '0'));
        $arr = $this->parseIntLine((string) ($lines[1] ?? ''));
        $target = (int) trim((string) ($lines[2] ?? '0'));

        $pos = [];
        foreach (array_slice($arr, 0, $n) as $idx => $value) {
            $need = $target - $value;
            if (array_key_exists($need, $pos)) {
                $a = (int) $pos[$need];
                $b = (int) $idx;
                if ($a > $b) {
                    [$a, $b] = [$b, $a];
                }

                return $a.' '.$b;
            }

            $pos[$value] = $idx;
        }

        return '-1 -1';
    }

    private function stdinParentheses(string $difficulty, DeterministicRng $rng): string
    {
        $length = match ($difficulty) {
            'hard' => $rng->int(200, 400),
            'medium' => $rng->int(80, 180),
            default => $rng->int(10, 60),
        };

        $makeValid = $rng->int(0, 1) === 1;

        if ($makeValid) {
            $open = 0;
            $out = '';
            for ($i = 0; $i < $length; $i++) {
                if ($open === 0) {
                    $out .= '(';
                    $open++;

                    continue;
                }

                if ($open >= ($length - $i)) {
                    $out .= ')';
                    $open--;

                    continue;
                }

                if ($rng->int(0, 1) === 1) {
                    $out .= '(';
                    $open++;
                } else {
                    $out .= ')';
                    $open--;
                }
            }

            while ($open > 0) {
                $out .= ')';
                $open--;
            }

            return $out."\n";
        }

        $out = str_repeat(')', max(1, (int) floor($length / 3)));
        $remaining = max(0, $length - strlen($out));
        for ($i = 0; $i < $remaining; $i++) {
            $out .= $rng->int(0, 1) === 1 ? '(' : ')';
        }

        return $out."\n";
    }

    private function expectedParentheses(string $stdin): string
    {
        $s = trim($stdin);
        $balance = 0;

        foreach (str_split($s) as $ch) {
            if ($ch === '(') {
                $balance++;
            } elseif ($ch === ')') {
                $balance--;
                if ($balance < 0) {
                    return 'false';
                }
            }
        }

        return $balance === 0 ? 'true' : 'false';
    }

    private function stdinReverseWords(string $difficulty, DeterministicRng $rng): string
    {
        $wordCount = match ($difficulty) {
            'hard' => $rng->int(30, 60),
            'medium' => $rng->int(12, 25),
            default => $rng->int(3, 10),
        };

        $words = [];
        for ($i = 0; $i < $wordCount; $i++) {
            $words[] = $this->randomWord($rng, $difficulty);
        }

        return implode(' ', $words)."\n";
    }

    private function expectedReverseWords(string $stdin): string
    {
        $words = preg_split('/\s+/', trim($stdin));
        $words = is_array($words) ? array_values(array_filter($words, fn (string $w): bool => $w !== '')) : [];

        return implode(' ', array_reverse($words));
    }

    private function stdinGraphComponents(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(60, 120),
            'medium' => $rng->int(25, 60),
            default => $rng->int(6, 25),
        };

        $maxEdges = match ($difficulty) {
            'hard' => $n * 3,
            'medium' => $n * 2,
            default => $n,
        };

        $m = $rng->int(0, max(1, $maxEdges));
        $edges = [];
        $used = [];

        for ($i = 0; $i < $m; $i++) {
            $u = $rng->int(0, $n - 1);
            $v = $rng->int(0, $n - 1);
            if ($u === $v) {
                continue;
            }
            $a = min($u, $v);
            $b = max($u, $v);
            $key = $a.':'.$b;
            if (array_key_exists($key, $used)) {
                continue;
            }
            $used[$key] = true;
            $edges[] = [$a, $b];
        }

        $lines = [];
        $lines[] = $n.' '.count($edges);
        foreach ($edges as [$u, $v]) {
            $lines[] = $u.' '.$v;
        }

        return implode("\n", $lines)."\n";
    }

    private function expectedGraphComponents(string $stdin): string
    {
        $lines = preg_split('/\r?\n/', trim($stdin));
        $first = $this->parseIntLine((string) ($lines[0] ?? ''));
        $n = (int) ($first[0] ?? 0);
        $m = (int) ($first[1] ?? 0);

        $adj = array_fill(0, max(0, $n), []);
        for ($i = 0; $i < $m; $i++) {
            $parts = $this->parseIntLine((string) ($lines[$i + 1] ?? ''));
            $u = (int) ($parts[0] ?? -1);
            $v = (int) ($parts[1] ?? -1);
            if ($u < 0 || $v < 0 || $u >= $n || $v >= $n) {
                continue;
            }
            $adj[$u][] = $v;
            $adj[$v][] = $u;
        }

        $seen = array_fill(0, max(0, $n), false);
        $components = 0;

        for ($start = 0; $start < $n; $start++) {
            if ($seen[$start]) {
                continue;
            }
            $components++;
            $stack = [$start];
            $seen[$start] = true;

            while ($stack !== []) {
                $node = array_pop($stack);
                foreach ($adj[$node] as $next) {
                    if (! $seen[$next]) {
                        $seen[$next] = true;
                        $stack[] = $next;
                    }
                }
            }
        }

        return (string) $components;
    }

    private function stdinBinarySearch(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(120, 220),
            'medium' => $rng->int(50, 120),
            default => $rng->int(8, 40),
        };

        $values = [];
        $current = $rng->int(-200, 0);
        for ($i = 0; $i < $n; $i++) {
            $current += $rng->int(1, 4);
            $values[] = $current;
        }

        $targetExists = $rng->int(0, 1) === 1;
        $target = $targetExists
            ? $values[$rng->int(0, $n - 1)]
            : $values[$rng->int(0, $n - 1)] + $rng->int(1, 3);

        return $n."\n".implode(' ', $values)."\n".$target."\n";
    }

    private function expectedBinarySearch(string $stdin): string
    {
        $lines = preg_split('/\r?\n/', trim($stdin));
        $n = (int) trim((string) ($lines[0] ?? '0'));
        $arr = $this->parseIntLine((string) ($lines[1] ?? ''));
        $target = (int) trim((string) ($lines[2] ?? '0'));

        $lo = 0;
        $hi = $n - 1;
        while ($lo <= $hi) {
            $mid = intdiv($lo + $hi, 2);
            $val = (int) ($arr[$mid] ?? 0);
            if ($val === $target) {
                return (string) $mid;
            }
            if ($val < $target) {
                $lo = $mid + 1;
            } else {
                $hi = $mid - 1;
            }
        }

        return '-1';
    }

    private function stdinFibonacci(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(5000, 10000),
            'medium' => $rng->int(800, 3000),
            default => $rng->int(0, 200),
        };

        return $n."\n";
    }

    private function expectedFibonacci(string $stdin): string
    {
        $n = (int) trim($stdin);
        $mod = 1_000_000_007;

        if ($n <= 0) {
            return '0';
        }

        if ($n === 1) {
            return '1';
        }

        $a = 0;
        $b = 1;
        for ($i = 2; $i <= $n; $i++) {
            $c = ($a + $b) % $mod;
            $a = $b;
            $b = $c;
        }

        return (string) $b;
    }

    private function stdinPairSum(string $difficulty, DeterministicRng $rng): string
    {
        $n = match ($difficulty) {
            'hard' => $rng->int(120, 220),
            'medium' => $rng->int(60, 120),
            default => $rng->int(6, 40),
        };

        $values = [];
        $current = $rng->int(-50, 10);
        for ($i = 0; $i < $n; $i++) {
            $current += $rng->int(0, 3);
            $values[] = $current;
        }

        if ($rng->int(0, 1) === 1) {
            $leftIndex = $rng->int(0, $n - 2);
            $rightIndex = $rng->int($leftIndex + 1, $n - 1);
            $target = $values[$leftIndex] + $values[$rightIndex];
        } else {
            $target = $values[0] + $values[$n - 1] + $rng->int(1, 3);
        }

        return $n."\n".implode(' ', $values)."\n".$target."\n";
    }

    private function expectedPairSum(string $stdin): string
    {
        $lines = preg_split('/\r?\n/', trim($stdin));
        $n = (int) trim((string) ($lines[0] ?? '0'));
        $arr = array_slice($this->parseIntLine((string) ($lines[1] ?? '')), 0, $n);
        $target = (int) trim((string) ($lines[2] ?? '0'));

        $i = 0;
        $j = count($arr) - 1;
        while ($i < $j) {
            $sum = (int) ($arr[$i] ?? 0) + (int) ($arr[$j] ?? 0);
            if ($sum === $target) {
                return 'true';
            }
            if ($sum < $target) {
                $i++;
            } else {
                $j--;
            }
        }

        return 'false';
    }

    private function stdinGcd(string $difficulty, DeterministicRng $rng): string
    {
        $max = match ($difficulty) {
            'hard' => 1_000_000_000,
            'medium' => 10_000_000,
            default => 100_000,
        };

        $a = $rng->int(1, $max);
        $b = $rng->int(1, $max);

        return $a.' '.$b."\n";
    }

    private function expectedGcd(string $stdin): string
    {
        $parts = $this->parseIntLine(trim($stdin));
        $a = (int) ($parts[0] ?? 0);
        $b = (int) ($parts[1] ?? 0);

        $a = abs($a);
        $b = abs($b);

        while ($b !== 0) {
            [$a, $b] = [$b, $a % $b];
        }

        return (string) $a;
    }

    private function stdinCoinChange(string $difficulty, DeterministicRng $rng): string
    {
        $amount = match ($difficulty) {
            'hard' => $rng->int(1, 5000),
            'medium' => $rng->int(1, 1500),
            default => $rng->int(1, 200),
        };

        return $amount."\n";
    }

    private function expectedCoinChange(string $stdin): string
    {
        $amount = max(0, (int) trim($stdin));
        $coins = [25, 10, 5, 1];
        $count = 0;

        foreach ($coins as $coin) {
            $use = intdiv($amount, $coin);
            $count += $use;
            $amount -= $use * $coin;
        }

        return (string) $count;
    }

    /**
     * @return array{0:int, 1:array<int, int>}
     */
    private function parseNAndIntArray(string $stdin): array
    {
        $lines = preg_split('/\r?\n/', trim($stdin));
        $n = (int) trim((string) ($lines[0] ?? '0'));
        $arr = $this->parseIntLine((string) ($lines[1] ?? ''));

        return [$n, $arr];
    }

    /**
     * @return array<int, int>
     */
    private function parseIntLine(string $line): array
    {
        $parts = preg_split('/\s+/', trim($line));
        $parts = is_array($parts) ? $parts : [];

        return array_values(array_map(fn (string $v): int => (int) $v, array_filter($parts, fn (string $v): bool => $v !== '')));
    }

    private function randomWord(DeterministicRng $rng, string $difficulty): string
    {
        $len = match ($difficulty) {
            'hard' => $rng->int(4, 10),
            'medium' => $rng->int(3, 8),
            default => $rng->int(2, 6),
        };

        $letters = 'abcdefghijklmnopqrstuvwxyz';
        $out = '';
        for ($i = 0; $i < $len; $i++) {
            $out .= $letters[$rng->int(0, strlen($letters) - 1)];
        }

        return $out;
    }
}

final class DeterministicRng
{
    public function __construct(private int $state) {}

    public function int(int $min, int $max): int
    {
        if ($min > $max) {
            [$min, $max] = [$max, $min];
        }

        $this->state = (int) ((1103515245 * $this->state + 12345) & 0x7FFFFFFF);
        $range = $max - $min + 1;

        if ($range <= 1) {
            return $min;
        }

        return $min + ($this->state % $range);
    }
}
