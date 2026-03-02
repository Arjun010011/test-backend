<?php

namespace App\Http\Requests\Recruiter;

use Illuminate\Foundation\Http\FormRequest;

class StoreCandidateWorkflowStatusRequest extends FormRequest
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
        return [
            'label' => ['required', 'string', 'max:60', 'unique:candidate_workflow_statuses,label'],
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
