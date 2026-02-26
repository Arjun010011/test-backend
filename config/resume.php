<?php

$skillCategories = [
    'Languages' => [
        'PHP',
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
    ],
    'Frameworks' => [
        'Laravel',
        'React',
        'Node.js',
        'Tailwind CSS',
    ],
    'Databases' => [
        'SQL',
        'MySQL',
        'PostgreSQL',
    ],
    'Cloud' => [
        'AWS',
    ],
    'Tools' => [
        'Docker',
        'Git',
        'Linux',
    ],
];

return [
    'skill_categories' => $skillCategories,
    'skill_catalog' => array_values(array_unique(array_merge(...array_values($skillCategories)))),
];
