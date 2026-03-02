<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company>
 */
class CompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'created_by_user_id' => User::factory()->admin(),
            'owner_user_id' => null,
            'approved_by_user_id' => null,
            'name' => fake()->unique()->company(),
            'job_role' => fake()->randomElement(['Backend Engineer', 'Frontend Engineer', 'Data Analyst']),
            'website' => fake()->boolean(70) ? fake()->url() : null,
            'location' => fake()->city().', '.fake()->state(),
            'description' => fake()->sentence(12),
            'source' => 'recruiter',
            'approval_status' => 'approved',
            'visibility' => 'public',
            'is_active' => true,
        ];
    }
}
