<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('assessment_attempts')) {
            return;
        }

        Schema::create('assessment_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignment_id')->nullable()->constrained('assessment_assignments')->nullOnDelete();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedInteger('time_taken_seconds')->nullable();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('max_score');
            $table->decimal('percentage', 5, 2)->nullable();
            $table->enum('status', ['in_progress', 'submitted', 'abandoned', 'expired'])->default('in_progress');
            $table->json('answers_snapshot')->nullable();
            $table->timestamps();

            $table->index(['candidate_id', 'assessment_id']);
            $table->index(['assessment_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_attempts');
    }
};
