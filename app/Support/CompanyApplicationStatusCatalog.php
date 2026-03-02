<?php

namespace App\Support;

class CompanyApplicationStatusCatalog
{
    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            'submitted',
            'under_review',
            'selected',
            'waiting_list',
            'accepted',
            'hired',
            'rejected',
        ];
    }
}
