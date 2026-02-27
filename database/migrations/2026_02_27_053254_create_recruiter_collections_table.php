<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('description', 500)->nullable();
            $table->timestamps();

            $table->unique(['recruiter_id', 'name']);
            $table->index(['recruiter_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_collections');
    }
};
