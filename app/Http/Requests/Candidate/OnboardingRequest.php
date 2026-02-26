<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class OnboardingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isCandidate() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $hasExistingResume = $this->user()?->resumes()->exists() ?? false;

        return [
            'phone' => ['required', 'string', 'max:50'],
            'university' => ['required', 'string', 'max:255'],
            'degree' => ['required', 'string', 'max:255'],
            'major' => ['required', 'string', 'max:255'],
            'cgpa' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'graduation_year' => ['required', 'integer', 'between:1950,2035'],
            'location' => ['required', 'string', 'max:255'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'postal_code' => ['required', 'string', 'max:30'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'skills' => ['nullable', 'string', 'max:1000'],
            'resume' => [
                $hasExistingResume ? 'nullable' : 'required',
                File::types(['pdf', 'doc', 'docx', 'txt'])->max(5 * 1024),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.required' => 'Please enter your phone number.',
            'university.required' => 'Please enter your college or university.',
            'degree.required' => 'Please select your degree.',
            'major.required' => 'Please select your major.',
            'graduation_year.required' => 'Please select your graduation year.',
            'location.required' => 'Please enter your current location.',
            'address_line_1.required' => 'Please enter your address line 1.',
            'city.required' => 'Please enter your city.',
            'state.required' => 'Please enter your state.',
            'country.required' => 'Please enter your country.',
            'postal_code.required' => 'Please enter your postal code.',
            'linkedin_url.url' => 'LinkedIn URL must be a valid full URL (for example: https://linkedin.com/in/username).',
            'github_url.url' => 'GitHub URL must be a valid full URL (for example: https://github.com/username).',
            'portfolio_url.url' => 'Portfolio URL must be a valid full URL (for example: https://your-site.com).',
            'resume.required' => 'Please upload your resume to complete your profile.',
            'resume.max' => 'Resume file size must not exceed 5MB.',
            'resume.mimes' => 'Resume must be a PDF, DOC, DOCX, or TXT file.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'cgpa' => 'CGPA',
            'graduation_year' => 'graduation year',
            'address_line_1' => 'address line 1',
            'address_line_2' => 'address line 2',
            'postal_code' => 'postal code',
            'linkedin_url' => 'LinkedIn URL',
            'github_url' => 'GitHub URL',
            'portfolio_url' => 'portfolio URL',
        ];
    }
}
