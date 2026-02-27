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
            $table->boolean('is_currently_studying')->default(false)->after('graduation_year');
            $table->unsignedTinyInteger('current_semester')->nullable()->after('is_currently_studying');
            $table->unsignedTinyInteger('total_semesters')->nullable()->after('current_semester');
            $table->date('semester_recorded_at')->nullable()->after('total_semesters');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'is_currently_studying',
                'current_semester',
                'total_semesters',
                'semester_recorded_at',
            ]);
        });
    }
};
