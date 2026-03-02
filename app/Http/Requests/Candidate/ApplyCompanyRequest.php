<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class ApplyCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCandidate() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cover_letter' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
