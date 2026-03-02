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
        Schema::create('company_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('cover_letter')->nullable();
            $table->string('status')->default('submitted');
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'candidate_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_applications');
    }
};
