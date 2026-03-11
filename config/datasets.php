<?php

return [
    'disk' => env('DATASETS_DISK', 'datasets'),

    'paths' => [
        'aptitude' => [
            'cs_engineering' => env('APTITUDE_DATASET_PATH', 'datasets/cs_engineering_aptitude_240.json'),
        ],

        'coding' => [
            'java' => env('JAVA_CODING_DATASET_PATH', 'datasets/java_coding_problem_bank.json'),
            'python' => env('PYTHON_CODING_DATASET_PATH', 'datasets/python_coding_problem_bank.json'),
            'javascript' => env('JAVASCRIPT_CODING_DATASET_PATH', 'datasets/javascript_coding_problem_bank.json'),
        ],
    ],
];
