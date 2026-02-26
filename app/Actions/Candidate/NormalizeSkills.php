<?php

namespace App\Actions\Candidate;

use Illuminate\Support\Str;

class NormalizeSkills
{
    /**
     * @param  list<string>  $skills
     * @return list<string>
     */
    public function normalize(array $skills): array
    {
        $catalog = config('resume.skill_catalog', []);
        $catalogMap = [];

        foreach ($catalog as $skill) {
            $catalogMap[Str::lower($skill)] = $skill;
        }

        $normalized = [];
        $unique = [];

        foreach ($skills as $skill) {
            $trimmed = trim(preg_replace('/\s+/u', ' ', $skill) ?? '');

            if ($trimmed === '') {
                continue;
            }

            $key = Str::lower($trimmed);
            $canonical = $catalogMap[$key] ?? $trimmed;
            $canonicalKey = Str::lower($canonical);

            if (array_key_exists($canonicalKey, $unique)) {
                continue;
            }

            $unique[$canonicalKey] = true;
            $normalized[] = $canonical;
        }

        return $normalized;
    }

    /**
     * @param  list<string>  $manualSkills
     * @param  list<string>  $extractedSkills
     * @return list<string>
     */
    public function merge(array $manualSkills, array $extractedSkills): array
    {
        return $this->normalize(array_merge($manualSkills, $extractedSkills));
    }

    /**
     * @return list<string>
     */
    public function fromString(?string $skills): array
    {
        if ($skills === null) {
            return [];
        }

        $parts = preg_split('/[,\n;]+/u', $skills) ?: [];

        return $this->normalize($parts);
    }
}
