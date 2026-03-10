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
        Schema::create('assessment_code_submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('assessment_questions')->cascadeOnDelete();
            $table->unsignedInteger('submission_number');
            $table->string('language')->default('java');
            $table->longText('source_code');
            $table->string('status')->default('queued'); // queued, running, completed, failed
            $table->string('verdict')->nullable(); // AC, WA, TLE, MLE, RE, CE
            $table->unsignedInteger('runtime_ms')->nullable();
            $table->unsignedInteger('memory_kb')->nullable();
            $table->unsignedInteger('sample_passed_count')->nullable();
            $table->unsignedInteger('sample_total_count')->nullable();
            $table->unsignedInteger('hidden_passed_count')->nullable();
            $table->unsignedInteger('hidden_total_count')->nullable();
            $table->text('compile_output')->nullable();
            $table->json('case_results')->nullable();
            $table->timestamps();

            $table->unique(['attempt_id', 'question_id', 'submission_number']);
            $table->index(['attempt_id', 'question_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_code_submissions');
    }
};
