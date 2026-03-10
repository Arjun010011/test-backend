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
        Schema::table('assessment_responses', function (Blueprint $table): void {
            if (Schema::hasColumn('assessment_responses', 'answer_language')) {
                return;
            }

            $table->string('answer_language')->nullable()->after('answer_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_responses', function (Blueprint $table): void {
            if (! Schema::hasColumn('assessment_responses', 'answer_language')) {
                return;
            }

            $table->dropColumn('answer_language');
        });
    }
};
