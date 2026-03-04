<?php

namespace App\Http\Requests\Recruiter;

use App\Services\QuestionProviderService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssessmentRequest extends FormRequest
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
        $availableTopics = array_keys(app(QuestionProviderService::class)->getAvailableTopics());

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:180'],
            'total_questions' => ['required', 'integer', 'min:5', 'max:100'],
            'passing_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'randomize_questions' => ['sometimes', 'boolean'],
            'show_results_immediately' => ['sometimes', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'active', 'private'])],
            'question_blueprint' => ['required', 'array', 'min:1'],
            'question_blueprint.*.topic' => ['required', 'string', 'distinct', Rule::in($availableTopics)],
            'question_blueprint.*.easy_count' => ['required', 'integer', 'min:0', 'max:100'],
            'question_blueprint.*.medium_count' => ['required', 'integer', 'min:0', 'max:100'],
            'question_blueprint.*.hard_count' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Assessment title is required.',
            'duration_minutes.min' => 'Assessment duration must be at least 5 minutes.',
            'total_questions.min' => 'At least 5 questions are required to create an assessment.',
            'question_blueprint.required' => 'Select at least one topic with question counts.',
            'question_blueprint.min' => 'Select at least one topic with question counts.',
            'question_blueprint.*.topic.distinct' => 'Each topic can only be selected once.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $questionBlueprint = collect($this->input('question_blueprint', []))
            ->map(function (mixed $selection): ?array {
                if (! is_array($selection)) {
                    return null;
                }

                $easyCount = max(0, (int) ($selection['easy_count'] ?? 0));
                $mediumCount = max(0, (int) ($selection['medium_count'] ?? 0));
                $hardCount = max(0, (int) ($selection['hard_count'] ?? 0));

                if (($easyCount + $mediumCount + $hardCount) === 0) {
                    return null;
                }

                return [
                    'topic' => (string) ($selection['topic'] ?? ''),
                    'easy_count' => $easyCount,
                    'medium_count' => $mediumCount,
                    'hard_count' => $hardCount,
                ];
            })
            ->filter()
            ->values();

        $totalQuestions = $questionBlueprint->sum(
            fn (array $selection): int => $selection['easy_count'] + $selection['medium_count'] + $selection['hard_count'],
        );

        $categories = $questionBlueprint->pluck('topic')->implode(', ');

        $this->merge([
            'question_blueprint' => $questionBlueprint->all(),
            'total_questions' => $totalQuestions,
            'category' => $categories === '' ? 'custom' : $categories,
            'difficulty' => 'mixed',
            'status' => (string) ($this->input('status') ?? ($this->boolean('publish_now') ? 'active' : 'draft')),
        ]);
    }
}
