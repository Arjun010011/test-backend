<?php

namespace Database\Factories;

use App\Enums\CandidateStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CandidateProfile>
 */
class CandidateProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $skills = fake()->randomElements(
            ['React', 'Laravel', 'PHP', 'Python', 'AWS', 'Docker', 'SQL'],
            fake()->numberBetween(2, 5),
        );
        $skillCategories = [];

        foreach (config('resume.skill_categories', []) as $category => $categorySkills) {
            $matched = array_values(array_intersect($skills, $categorySkills));

            if ($matched !== []) {
                $skillCategories[$category] = $matched;
            }
        }

        return [
            'user_id' => \App\Models\User::factory()->candidate(),
            'phone' => fake()->phoneNumber(),
            'university' => fake()->company(),
            'degree' => fake()->randomElement(['B.Tech', 'B.E', 'M.Tech', 'BCA', 'MCA']),
            'major' => fake()->randomElement(['Computer Science', 'Information Technology', 'Electronics']),
            'cgpa' => fake()->randomFloat(2, 6, 10),
            'graduation_year' => fake()->numberBetween(2020, 2026),
            'skills' => $skills,
            'skill_categories' => $skillCategories,
            'candidate_status' => CandidateStatus::New,
            'bio' => fake()->paragraph(),
            'achievements' => fake()->sentence(),
            'hackathons_experience' => fake()->paragraph(),
            'projects_description' => fake()->paragraph(),
            'location' => fake()->city(),
            'address_line_1' => fake()->streetAddress(),
            'address_line_2' => fake()->secondaryAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'district' => fake()->city(),
            'country' => 'India',
            'postal_code' => fake()->numerify('######'),
            'linkedin_url' => 'https://linkedin.com/in/'.fake()->userName(),
            'github_url' => 'https://github.com/'.fake()->userName(),
            'portfolio_url' => fake()->url(),
            'profile_completed_at' => now(),
        ];
    }
}
