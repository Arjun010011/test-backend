<?php

namespace App\Support;

use App\Models\CandidateWorkflowStatus;
use Illuminate\Support\Str;

class CandidateStatusCatalog
{
    /**
     * @return \Illuminate\Support\Collection<int, array{id: int, value: string, label: string, color: string, is_default: bool}>
     */
    public function options()
    {
        return CandidateWorkflowStatus::query()
            ->orderByDesc('is_default')
            ->orderBy('label')
            ->get()
            ->map(fn (CandidateWorkflowStatus $status): array => [
                'id' => $status->id,
                'value' => $status->key,
                'label' => $status->label,
                'color' => $status->color,
                'is_default' => $status->is_default,
            ]);
    }

    /**
     * @return array{value: string, label: string, color: string}
     */
    public function optionFor(?string $key): array
    {
        if ($key === null || $key === '') {
            return [
                'value' => 'new',
                'label' => 'New',
                'color' => 'gray',
            ];
        }

        $status = CandidateWorkflowStatus::query()->where('key', $key)->first();

        if ($status === null) {
            return [
                'value' => $key,
                'label' => Str::title(str_replace('_', ' ', $key)),
                'color' => 'gray',
            ];
        }

        return [
            'value' => $status->key,
            'label' => $status->label,
            'color' => $status->color,
        ];
    }
}
