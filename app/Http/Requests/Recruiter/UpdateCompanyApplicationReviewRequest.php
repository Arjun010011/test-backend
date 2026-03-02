<?php

namespace App\Http\Requests\Recruiter;

use App\Support\CompanyApplicationStatusCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyApplicationReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(CompanyApplicationStatusCatalog::values())],
            'review_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
