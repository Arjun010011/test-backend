<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class RunCodingSamplesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isCandidate() || $user->isSuperAdmin());
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'language' => ['required', 'string', 'max:20'],
            'source_code' => ['required', 'string', 'max:200000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'language.required' => 'Please choose a language before running samples.',
            'source_code.required' => 'Code is required to run sample test cases.',
        ];
    }
}
