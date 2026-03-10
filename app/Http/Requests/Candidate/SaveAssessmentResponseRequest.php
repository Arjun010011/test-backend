<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class SaveAssessmentResponseRequest extends FormRequest
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
            'question_id' => ['required', 'integer', 'exists:assessment_questions,id'],
            'selected_option_id' => ['nullable', 'integer', 'exists:assessment_question_options,id', 'required_without:answer_text'],
            'answer_text' => ['nullable', 'string', 'max:200000', 'required_without:selected_option_id'],
            'language' => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'question_id.required' => 'Question is required.',
            'selected_option_id.required_without' => 'Please choose an option before saving.',
            'answer_text.required_without' => 'Code is required before saving.',
        ];
    }
}
