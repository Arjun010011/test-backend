<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_collection_candidate', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_collection_id')->constrained('recruiter_collections')->cascadeOnDelete();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('added_by_recruiter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['recruiter_collection_id', 'candidate_user_id'], 'recruiter_collection_candidate_unique');
            $table->index('candidate_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_collection_candidate');
    }
};
