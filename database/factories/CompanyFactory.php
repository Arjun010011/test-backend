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
            'salary_min_lpa' => fake()->randomFloat(2, 2, 12),
            'salary_max_lpa' => fake()->randomFloat(2, 12, 28),
            'experience_min_years' => fake()->randomFloat(1, 0, 2),
            'experience_max_years' => fake()->randomFloat(1, 2, 8),
            'employment_type' => fake()->randomElement(['full_time', 'internship', 'contract']),
            'work_mode' => fake()->randomElement(['on_site', 'hybrid', 'remote']),
            'openings' => fake()->numberBetween(1, 12),
            'skills_required' => fake()->sentence(10),
            'application_deadline' => now()->addDays(fake()->numberBetween(7, 60))->toDateString(),
            'source' => 'recruiter',
            'approval_status' => 'approved',
            'visibility' => 'public',
            'is_active' => true,
        ];
    }
}
