<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRecruitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCompany() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'job_role' => ['required', 'string', 'max:160'],
            'website' => ['nullable', 'url', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'salary_min_lpa' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'salary_max_lpa' => ['nullable', 'numeric', 'min:0', 'max:999.99', 'gte:salary_min_lpa'],
            'experience_min_years' => ['nullable', 'numeric', 'min:0', 'max:99.9'],
            'experience_max_years' => ['nullable', 'numeric', 'min:0', 'max:99.9', 'gte:experience_min_years'],
            'employment_type' => ['nullable', 'string', 'in:full_time,part_time,contract,internship,freelance'],
            'work_mode' => ['nullable', 'string', 'in:on_site,hybrid,remote'],
            'openings' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'skills_required' => ['nullable', 'string', 'max:3000'],
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
