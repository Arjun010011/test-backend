<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRecruitmentVisibilityRequest extends FormRequest
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
            'visibility' => ['required', 'string', 'in:public,private'],
        ];
    }
}
