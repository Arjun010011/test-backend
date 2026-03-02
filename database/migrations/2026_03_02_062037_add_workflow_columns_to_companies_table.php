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
        Schema::table('companies', function (Blueprint $table) {
            $table->foreignId('owner_user_id')->nullable()->after('created_by_user_id')->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->after('owner_user_id')->constrained('users')->nullOnDelete();
            $table->string('source')->default('recruiter')->after('description');
            $table->string('approval_status')->default('approved')->after('source');
            $table->string('visibility')->default('public')->after('approval_status');
            $table->index(['approval_status', 'visibility']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_user_id');
            $table->dropConstrainedForeignId('approved_by_user_id');
            $table->dropIndex(['approval_status', 'visibility']);
            $table->dropColumn(['source', 'approval_status', 'visibility']);
        });
    }
};
