<?php

use App\Services\QuestionProviderService;
use Illuminate\Support\Facades\File;

it('marks the correct option when answer contains symbols like currency or percent', function () {
    File::shouldReceive('exists')
        ->once()
        ->andReturn(true);

    File::shouldReceive('get')
        ->once()
        ->andReturn(json_encode([
            'questions' => [
                [
                    'id' => 1,
                    'source_file' => 'mock',
                    'category' => 'Quantitative Aptitude',
                    'difficulty' => 'easy',
                    'question' => 'What is the discounted price?',
                    'answer' => '$180',
                    'solution' => 'After discount, amount is 180.',
                    'options' => [
                        ['label' => 'A', 'text' => '200'],
                        ['label' => 'B', 'text' => '180'],
                        ['label' => 'C', 'text' => '160'],
                        ['label' => 'D', 'text' => '220'],
                    ],
                ],
            ],
        ]));

    $service = new QuestionProviderService;

    $questions = $service->generateQuestionsFromBlueprint([
        [
            'topic' => 'quantitative_aptitude',
            'easy_count' => 1,
            'medium_count' => 0,
            'hard_count' => 0,
        ],
    ]);

    $correctOption = collect($questions[0]['options'])->firstWhere('is_correct', true);

    expect($correctOption)->not->toBeNull()
        ->and($correctOption['option_text'])->toBe('180');
});
