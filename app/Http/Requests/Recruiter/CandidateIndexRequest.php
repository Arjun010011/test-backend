<?php

namespace App\Http\Requests\Recruiter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CandidateIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isAdmin() || $user->isSuperAdmin());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'exists:candidate_workflow_statuses,key'],
            'starred' => ['nullable', 'boolean'],
            'passed_out' => ['nullable', 'boolean'],
            'has_resume' => ['nullable', 'boolean'],
            'collection' => ['nullable', 'integer', 'exists:recruiter_collections,id'],
            'sort' => ['nullable', 'string', Rule::in(['latest', 'most_starred'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'include_keywords' => ['nullable', 'string', 'max:200'],
            'exclude_keywords' => ['nullable', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:120'],
            'experience_min' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'experience_max' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'industries' => ['nullable', 'array', 'max:15'],
            'industries.*' => ['nullable', 'string', 'max:120'],
            'current_company' => ['nullable', 'string', 'max:255'],
            'previous_company' => ['nullable', 'string', 'max:255'],
            'salary_min' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'degree' => ['nullable', 'string', 'max:255'],
            'major' => ['nullable', 'string', 'max:255'],
            'university' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'age_min' => ['nullable', 'integer', 'min:16', 'max:80'],
            'age_max' => ['nullable', 'integer', 'min:16', 'max:80'],
            'languages' => ['nullable', 'array', 'max:15'],
            'languages.*' => ['nullable', 'string', 'max:80'],
            'english_fluency' => ['nullable', 'string', Rule::in(['basic', 'conversational', 'fluent', 'native'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'search.max' => 'Search text may not exceed 120 characters.',
            'status.in' => 'Select a valid candidate status.',
            'sort.in' => 'Select either latest or most_starred sorting.',
            'collection.exists' => 'The selected collection does not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $starred = $this->input('starred');
        $passedOut = $this->input('passed_out');
        $hasResume = $this->input('has_resume');

        if (is_string($starred) && in_array($starred, ['0', '1', 'true', 'false'], true)) {
            $this->merge([
                'starred' => filter_var($starred, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        if (is_string($passedOut) && in_array($passedOut, ['0', '1', 'true', 'false'], true)) {
            $this->merge([
                'passed_out' => filter_var($passedOut, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        if (is_string($hasResume) && in_array($hasResume, ['0', '1', 'true', 'false'], true)) {
            $this->merge([
                'has_resume' => filter_var($hasResume, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        foreach (['industries', 'languages'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $value = preg_split('/[,\n;]+/u', $value) ?: [];
            }

            if (is_array($value)) {
                $this->merge([
                    $field => collect($value)
                        ->map(fn ($item): string => trim((string) $item))
                        ->filter(fn (string $item): bool => $item !== '')
                        ->values()
                        ->all(),
                ]);
            }
        }
    }
}
