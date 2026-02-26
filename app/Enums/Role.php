<?php

namespace App\Enums;

enum Role: string
{
    case Candidate = 'candidate';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';
}
