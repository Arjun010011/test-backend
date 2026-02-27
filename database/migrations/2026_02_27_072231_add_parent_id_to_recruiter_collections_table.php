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
        Schema::table('recruiter_collections', function (Blueprint $table) {
            $table->foreignId('parent_id')
                ->nullable()
                ->after('recruiter_id')
                ->constrained('recruiter_collections')
                ->nullOnDelete();
            $table->index(['recruiter_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recruiter_collections', function (Blueprint $table) {
            $table->dropIndex(['recruiter_id', 'parent_id']);
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
