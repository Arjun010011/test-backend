<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

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
            'is_currently_studying' => ['nullable', 'boolean'],
            'current_semester' => [
                Rule::requiredIf(fn (): bool => $this->boolean('is_currently_studying')),
                'nullable',
                'integer',
                'min:1',
                'max:20',
            ],
            'total_semesters' => [
                Rule::requiredIf(fn (): bool => $this->boolean('is_currently_studying')),
                'nullable',
                'integer',
                'min:1',
                'max:20',
                'gte:current_semester',
            ],
            'location' => ['required', 'string', 'max:255'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'district' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', Rule::in([$this->countryName()])],
            'postal_code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'achievements' => ['nullable', 'string', 'max:3000'],
            'hackathons_experience' => ['nullable', 'string', 'max:3000'],
            'projects_description' => ['nullable', 'string', 'max:4000'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'experience_years' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'current_company' => ['nullable', 'string', 'max:255'],
            'previous_company' => ['nullable', 'string', 'max:255'],
            'industries' => ['nullable', 'array', 'max:20'],
            'industries.*' => ['nullable', 'string', 'max:120'],
            'annual_salary_lpa' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'languages' => ['nullable', 'array', 'max:20'],
            'languages.*' => ['nullable', 'string', 'max:80'],
            'english_fluency' => ['nullable', 'string', Rule::in(['basic', 'conversational', 'fluent', 'native'])],
            'skills' => ['nullable', 'array', 'max:100'],
            'skills.*' => ['nullable', 'string', 'max:120'],
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
            'current_semester.required' => 'Please enter your current semester.',
            'total_semesters.required' => 'Please enter total semesters for your degree.',
            'total_semesters.gte' => 'Total semesters must be greater than or equal to current semester.',
            'location.required' => 'Please enter your current location.',
            'address_line_1.required' => 'Please enter your address line 1.',
            'city.required' => 'Please enter your city.',
            'state.required' => 'Please enter your state.',
            'district.required' => 'Please enter your district.',
            'country.required' => 'Please enter your country.',
            'country.in' => 'Please select a valid country.',
            'postal_code.required' => 'Please enter your postal code.',
            'postal_code.size' => 'Postal code must be exactly 6 digits.',
            'postal_code.regex' => 'Postal code must contain only digits.',
            'linkedin_url.url' => 'LinkedIn URL must be a valid full URL (for example: https://linkedin.com/in/username).',
            'github_url.url' => 'GitHub URL must be a valid full URL (for example: https://github.com/username).',
            'portfolio_url.url' => 'Portfolio URL must be a valid full URL (for example: https://your-site.com).',
            'achievements.max' => 'Achievements must not exceed 3000 characters.',
            'hackathons_experience.max' => 'Hackathons experience must not exceed 3000 characters.',
            'projects_description.max' => 'Projects description must not exceed 4000 characters.',
            'date_of_birth.before' => 'Date of birth must be in the past.',
            'experience_years.max' => 'Experience must be 50 years or less.',
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
            'district' => 'district',
            'postal_code' => 'postal code',
            'linkedin_url' => 'LinkedIn URL',
            'github_url' => 'GitHub URL',
            'portfolio_url' => 'portfolio URL',
            'hackathons_experience' => 'hackathons experience',
            'projects_description' => 'projects description',
            'date_of_birth' => 'date of birth',
            'experience_years' => 'years of experience',
            'annual_salary_lpa' => 'annual salary (LPA)',
            'english_fluency' => 'English fluency level',
        ];
    }

    protected function prepareForValidation(): void
    {
        $skills = $this->input('skills');

        if (is_string($skills)) {
            $skills = preg_split('/[,\n;]+/u', $skills) ?: [];
        }

        if (is_array($skills)) {
            $this->merge([
                'skills' => collect($skills)
                    ->map(fn ($skill): string => trim((string) $skill))
                    ->filter(fn (string $skill): bool => $skill !== '')
                    ->values()
                    ->all(),
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

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $country = (string) $this->input('country');
                $state = (string) $this->input('state');
                $district = (string) $this->input('district');
                $city = (string) $this->input('city');
                $postalCode = (string) $this->input('postal_code');
                $states = $this->availableStates();

                if ($country !== $this->countryName()) {
                    $validator->errors()->add('country', 'Please select a valid country.');
                }

                if (! in_array($state, $states, true)) {
                    $validator->errors()->add('state', 'Please select a valid state for the selected country.');

                    return;
                }

                $districts = $this->districtsForState($state);

                if (! in_array($district, $districts, true)) {
                    $validator->errors()->add('district', 'Please select a valid district for the selected state.');

                    return;
                }

                $cities = $this->citiesForState($state);

                if (! in_array($city, $cities, true)) {
                    $validator->errors()->add('city', 'Please select a valid city for the selected state.');

                    return;
                }

                $postalCodePattern = $this->postalCodePattern($state, $city);

                if ($postalCodePattern !== null && ! preg_match($postalCodePattern, $postalCode)) {
                    $validator->errors()->add('postal_code', 'Please enter a valid postal code for the selected city.');
                }
            },
        ];
    }

    /**
     * @return array<string, array{districts: list<string>, cities: list<string>, city_postal_patterns?: array<string, string>}>
     */
    protected function locationStates(): array
    {
        /** @var array<string, array{districts: list<string>, cities: list<string>, city_postal_patterns?: array<string, string>}> $states */
        $states = config('location.states', []);

        return $states;
    }

    protected function countryName(): string
    {
        return (string) config('location.country', 'India');
    }

    /**
     * @return list<string>
     */
    protected function availableStates(): array
    {
        return array_keys($this->locationStates());
    }

    /**
     * @return list<string>
     */
    protected function districtsForState(string $state): array
    {
        return $this->locationStates()[$state]['districts'] ?? [];
    }

    /**
     * @return list<string>
     */
    protected function citiesForState(string $state): array
    {
        return $this->locationStates()[$state]['cities'] ?? [];
    }

    protected function postalCodePattern(string $state, string $city): ?string
    {
        return $this->locationStates()[$state]['city_postal_patterns'][$city] ?? null;
    }
}
