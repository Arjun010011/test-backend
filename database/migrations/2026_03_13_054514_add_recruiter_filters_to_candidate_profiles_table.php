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
            $table->string('gender', 32)->nullable()->after('profile_photo_path');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->decimal('experience_years', 5, 2)->nullable()->after('date_of_birth');
            $table->string('current_company')->nullable()->after('experience_years');
            $table->string('previous_company')->nullable()->after('current_company');
            $table->json('industries')->nullable()->after('previous_company');
            $table->decimal('annual_salary_lpa', 8, 2)->nullable()->after('industries');
            $table->json('languages')->nullable()->after('annual_salary_lpa');
            $table->string('english_fluency', 40)->nullable()->after('languages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'gender',
                'date_of_birth',
                'experience_years',
                'current_company',
                'previous_company',
                'industries',
                'annual_salary_lpa',
                'languages',
                'english_fluency',
            ]);
        });
    }
};
