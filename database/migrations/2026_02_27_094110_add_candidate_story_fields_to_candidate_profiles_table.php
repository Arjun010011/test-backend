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
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->text('achievements')->nullable()->after('bio');
            $table->text('hackathons_experience')->nullable()->after('achievements');
            $table->text('projects_description')->nullable()->after('hackathons_experience');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'achievements',
                'hackathons_experience',
                'projects_description',
            ]);
        });
    }
};
