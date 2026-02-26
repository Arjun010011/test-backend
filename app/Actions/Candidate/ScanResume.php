<?php

namespace App\Actions\Candidate;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ScanResume
{
    /**
     * @return array{raw_text: ?string, extracted_skills: list<string>}
     */
    public function __invoke(UploadedFile $file): array
    {
        $rawText = $this->extractText($file);

        return [
            'raw_text' => $rawText,
            'extracted_skills' => $rawText === null ? [] : $this->extractSkills($rawText),
        ];
    }

    protected function extractText(UploadedFile $file): ?string
    {
        $mimeType = $file->getMimeType();

        if ($mimeType === null || ! Str::startsWith($mimeType, 'text/')) {
            return null;
        }

        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            return null;
        }

        $trimmed = trim($contents);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @return list<string>
     */
    protected function extractSkills(string $text): array
    {
        $catalog = config('resume.skill_catalog', []);
        $normalizedText = Str::lower($text);
        $matches = [];

        foreach ($catalog as $skill) {
            $normalizedSkill = Str::lower($skill);

            if ($normalizedSkill === '') {
                continue;
            }

            if (preg_match($this->skillPattern($normalizedSkill), $normalizedText) === 1) {
                $matches[] = $skill;
            }
        }

        return array_values(array_unique($matches));
    }

    protected function skillPattern(string $skill): string
    {
        $escaped = preg_quote($skill, '/');

        if (str_contains($skill, '+') || str_contains($skill, '#') || str_contains($skill, '.')) {
            return '/(?<!\w)' . $escaped . '(?!\w)/u';
        }

        return '/\b' . $escaped . '\b/u';
    }
}
