<?php

namespace App\Actions\Candidate;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser;
use ZipArchive;

class ScanResume
{
    /**
     * @return array{raw_text: ?string, extracted_skills: list<string>, skill_categories: array<string, list<string>>}
     */
    public function __invoke(UploadedFile $file): array
    {
        $rawText = $this->extractText($file);
        $skills = $rawText === null ? [] : $this->extractSkills($rawText);

        return [
            'raw_text' => $rawText,
            'extracted_skills' => $skills,
            'skill_categories' => $this->categorizeSkills($skills),
        ];
    }

    protected function extractText(UploadedFile $file): ?string
    {
        $extension = Str::lower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $mimeType = $file->getMimeType();

        if ($extension === 'pdf' || ($mimeType !== null && str_contains($mimeType, 'pdf'))) {
            return $this->extractPdfText($file);
        }

        if ($extension === 'docx' || ($mimeType !== null && str_contains($mimeType, 'officedocument.wordprocessingml.document'))) {
            return $this->extractDocxText($file);
        }

        if ($extension === 'txt' || ($mimeType !== null && Str::startsWith($mimeType, 'text/'))) {
            return $this->extractPlainText($file);
        }

        return null;
    }

    protected function extractPlainText(UploadedFile $file): ?string
    {
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            return null;
        }

        return $this->sanitizeText($contents);
    }

    protected function extractPdfText(UploadedFile $file): ?string
    {
        $path = $file->getRealPath();

        if ($path === false) {
            return null;
        }

        try {
            $parser = new Parser;
            $text = $parser->parseFile($path)->getText();
        } catch (\Throwable) {
            return null;
        }

        return $this->sanitizeText($text);
    }

    protected function extractDocxText(UploadedFile $file): ?string
    {
        $path = $file->getRealPath();

        if ($path === false) {
            return null;
        }

        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            return null;
        }

        $documentXml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($documentXml === false) {
            return null;
        }

        $text = preg_replace('/<\/w:p>/i', "\n", $documentXml);
        $text = preg_replace('/<\/w:tab>/i', "\t", $text ?? $documentXml);
        $text = strip_tags($text ?? $documentXml);

        return $this->sanitizeText($text);
    }

    protected function sanitizeText(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        $trimmed = trim(preg_replace('/\s+/u', ' ', $text) ?? '');

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
            return '/(?<!\w)'.$escaped.'(?!\w)/u';
        }

        return '/\b'.$escaped.'\b/u';
    }

    /**
     * @param  list<string>  $skills
     * @return array<string, list<string>>
     */
    public function categorize(array $skills): array
    {
        return $this->categorizeSkills($skills);
    }

    /**
     * @param  list<string>  $skills
     * @return array<string, list<string>>
     */
    protected function categorizeSkills(array $skills): array
    {
        $categories = config('resume.skill_categories', []);

        if ($skills === [] || $categories === []) {
            return [];
        }

        $normalizedSkills = [];

        foreach ($skills as $skill) {
            $normalizedSkills[Str::lower($skill)] = $skill;
        }

        $categorized = [];

        foreach ($categories as $category => $categorySkills) {
            $matched = [];

            foreach ($categorySkills as $categorySkill) {
                $normalized = Str::lower($categorySkill);

                if (array_key_exists($normalized, $normalizedSkills)) {
                    $matched[] = $normalizedSkills[$normalized];
                }
            }

            if ($matched !== []) {
                $categorized[$category] = array_values(array_unique($matched));
            }
        }

        return $categorized;
    }
}
