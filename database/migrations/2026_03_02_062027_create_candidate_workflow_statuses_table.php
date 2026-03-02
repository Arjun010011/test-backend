<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('candidate_workflow_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('color')->default('gray');
            $table->boolean('is_default')->default(false);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $now = now();
        DB::table('candidate_workflow_statuses')->insert([
            [
                'key' => 'new',
                'label' => 'New',
                'color' => 'gray',
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'in_review',
                'label' => 'In Review',
                'color' => 'blue',
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'shortlisted',
                'label' => 'Shortlisted',
                'color' => 'green',
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'rejected',
                'label' => 'Rejected',
                'color' => 'red',
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'hired',
                'label' => 'Hired',
                'color' => 'purple',
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_workflow_statuses');
    }
};
