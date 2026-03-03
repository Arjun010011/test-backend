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
            $table->decimal('salary_min_lpa', 6, 2)->nullable()->after('description');
            $table->decimal('salary_max_lpa', 6, 2)->nullable()->after('salary_min_lpa');
            $table->decimal('experience_min_years', 4, 1)->nullable()->after('salary_max_lpa');
            $table->decimal('experience_max_years', 4, 1)->nullable()->after('experience_min_years');
            $table->string('employment_type', 40)->nullable()->after('experience_max_years');
            $table->string('work_mode', 40)->nullable()->after('employment_type');
            $table->unsignedInteger('openings')->nullable()->after('work_mode');
            $table->text('skills_required')->nullable()->after('openings');
            $table->date('application_deadline')->nullable()->after('skills_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'salary_min_lpa',
                'salary_max_lpa',
                'experience_min_years',
                'experience_max_years',
                'employment_type',
                'work_mode',
                'openings',
                'skills_required',
                'application_deadline',
            ]);
        });
    }
};
