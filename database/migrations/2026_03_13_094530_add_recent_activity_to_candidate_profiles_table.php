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
            $table->text('recent_activity')->nullable()->after('english_fluency');
            $table->timestamp('recent_activity_updated_at')->nullable()->after('recent_activity');
            $table->foreignId('recent_activity_updated_by')->nullable()->after('recent_activity_updated_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recent_activity_updated_by');
            $table->dropColumn([
                'recent_activity',
                'recent_activity_updated_at',
            ]);
        });
    }
};
