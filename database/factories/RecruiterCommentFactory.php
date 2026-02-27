<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RecruiterComment>
 */
class RecruiterCommentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'recruiter_id' => \App\Models\User::factory()->admin(),
            'candidate_user_id' => \App\Models\User::factory()->candidate(),
            'body' => fake()->paragraph(),
        ];
    }
}
