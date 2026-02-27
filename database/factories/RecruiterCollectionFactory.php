<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RecruiterCollection>
 */
class RecruiterCollectionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'recruiter_id' => \App\Models\User::factory()->admin(),
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
        ];
    }
}
