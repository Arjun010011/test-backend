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
        Schema::create('assessment_question_test_cases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('question_id')->constrained('assessment_questions')->cascadeOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->text('stdin')->nullable();
            $table->text('expected_stdout');
            $table->unsignedInteger('points')->default(1);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['question_id', 'is_sample']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_question_test_cases');
    }
};
