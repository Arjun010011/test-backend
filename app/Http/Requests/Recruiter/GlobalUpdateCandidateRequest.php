<?php

namespace App\Http\Requests\Recruiter;

use Illuminate\Foundation\Http\FormRequest;

class GlobalUpdateCandidateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'exists:candidate_workflow_statuses,key'],
            'comment' => ['nullable', 'string', 'max:5000'],
            'collections' => ['nullable', 'array'],
            'collections.*' => ['integer', 'exists:recruiter_collections,id'],
            'recent_activity' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
