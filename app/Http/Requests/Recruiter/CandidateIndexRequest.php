<?php

namespace App\Http\Requests\Recruiter;

use App\Enums\CandidateStatus;
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
            'status' => ['nullable', 'string', Rule::in(CandidateStatus::values())],
            'starred' => ['nullable', 'boolean'],
            'passed_out' => ['nullable', 'boolean'],
            'collection' => ['nullable', 'integer', 'exists:recruiter_collections,id'],
            'sort' => ['nullable', 'string', Rule::in(['latest', 'most_starred'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
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
    }
}
