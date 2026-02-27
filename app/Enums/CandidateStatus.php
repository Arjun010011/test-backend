<?php

namespace App\Enums;

enum CandidateStatus: string
{
    case New = 'new';
    case InReview = 'in_review';
    case Shortlisted = 'shortlisted';
    case Rejected = 'rejected';
    case Hired = 'hired';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::InReview => 'In Review',
            self::Shortlisted => 'Shortlisted',
            self::Rejected => 'Rejected',
            self::Hired => 'Hired',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::New => 'gray',
            self::InReview => 'blue',
            self::Shortlisted => 'green',
            self::Rejected => 'red',
            self::Hired => 'purple',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $status): string => $status->value,
            self::cases(),
        );
    }
}
