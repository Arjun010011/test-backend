<?php

namespace App\Http\Requests\Recruiter;

use App\Models\CandidateWorkflowStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCandidateWorkflowStatusRequest extends FormRequest
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
        /** @var CandidateWorkflowStatus $status */
        $status = $this->route('status');

        return [
            'label' => [
                'required',
                'string',
                'max:60',
                Rule::unique('candidate_workflow_statuses', 'label')->ignore($status),
            ],
            'color' => ['nullable', 'string', 'in:gray,blue,green,red,purple,amber,cyan'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'label.unique' => 'This status label already exists.',
        ];
    }
}
