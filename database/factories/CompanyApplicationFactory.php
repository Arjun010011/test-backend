<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CompanyApplication>
 */
class CompanyApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'candidate_user_id' => User::factory()->candidate(),
            'cover_letter' => fake()->paragraph(),
            'status' => 'submitted',
            'review_note' => null,
            'applied_at' => now(),
        ];
    }
}
