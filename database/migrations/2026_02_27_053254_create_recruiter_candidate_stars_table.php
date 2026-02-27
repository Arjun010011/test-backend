<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_candidate_stars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['recruiter_id', 'candidate_user_id'], 'recruiter_candidate_stars_unique');
            $table->index('candidate_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_candidate_stars');
    }
};
