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
        $hasLegacyAssessmentSchema = Schema::hasTable('assessments')
            && Schema::hasColumn('assessments', 'aptitude_count');

        if ($hasLegacyAssessmentSchema) {
            Schema::disableForeignKeyConstraints();

            Schema::dropIfExists('assessment_responses');
            Schema::dropIfExists('assessment_question_options');
            Schema::dropIfExists('assessment_questions');
            Schema::dropIfExists('assessment_attempts');
            Schema::dropIfExists('assessment_assignments');
            Schema::dropIfExists('assessments');

            Schema::enableForeignKeyConstraints();
        }

        if (Schema::hasTable('assessments')) {
            return;
        }

        Schema::create('assessments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category');
            $table->enum('difficulty', ['easy', 'medium', 'hard', 'mixed']);
            $table->unsignedInteger('duration_minutes');
            $table->unsignedInteger('total_questions');
            $table->unsignedInteger('passing_score')->nullable();
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('show_results_immediately')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
