<?php

namespace App\Enums;

enum Role: string
{
    case Candidate = 'candidate';
    case Company = 'company';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';
}
