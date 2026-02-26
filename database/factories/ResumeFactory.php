<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Resume>
 */
class ResumeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory()->candidate(),
            'file_path' => 'resumes/' . fake()->uuid() . '.pdf',
            'original_name' => fake()->word() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => fake()->numberBetween(10_000, 500_000),
            'is_primary' => false,
            'extracted_skills' => fake()->randomElements(
                ['PHP', 'Laravel', 'React', 'JavaScript', 'TypeScript', 'SQL'],
                fake()->numberBetween(2, 4)
            ),
            'raw_text' => fake()->paragraph(),
        ];
    }
}
