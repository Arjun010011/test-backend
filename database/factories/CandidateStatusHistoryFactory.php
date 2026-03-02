<?php

namespace Database\Factories;

use App\Enums\CandidateStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CandidateStatusHistory>
 */
class CandidateStatusHistoryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'candidate_user_id' => \App\Models\User::factory()->candidate(),
            'recruiter_id' => \App\Models\User::factory()->admin(),
            'from_status' => CandidateStatus::New->value,
            'to_status' => fake()->randomElement(CandidateStatus::cases())->value,
            'note' => fake()->sentence(),
        ];
    }
}
