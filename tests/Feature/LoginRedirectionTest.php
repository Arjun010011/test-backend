<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginRedirectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_redirects_to_recruiter_dashboard_after_login(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'role' => Role::Admin,
        ]);

        $response = $this->post('/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('recruiter.dashboard'));
        $this->assertAuthenticatedAs($admin);
    }

    public function test_superadmin_redirects_to_recruiter_dashboard_after_login(): void
    {
        $superadmin = User::factory()->create([
            'email' => 'superadmin@example.com',
            'role' => Role::SuperAdmin,
        ]);

        $response = $this->post('/login', [
            'email' => 'superadmin@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('recruiter.dashboard'));
        $this->assertAuthenticatedAs($superadmin);
    }

    public function test_candidate_redirects_to_default_dashboard_after_login(): void
    {
        $candidate = User::factory()->create([
            'email' => 'candidate@example.com',
            'role' => Role::Candidate,
        ]);

        $response = $this->post('/login', [
            'email' => 'candidate@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($candidate);
    }

    public function test_candidate_cannot_access_recruiter_dashboard(): void
    {
        $candidate = User::factory()->create([
            'role' => Role::Candidate,
        ]);

        $response = $this->actingAs($candidate)->get(route('recruiter.dashboard'));

        $response->assertStatus(403);
    }

    public function test_admin_cannot_access_candidate_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => Role::Admin,
        ]);

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertRedirect(route('recruiter.dashboard'));
    }
}
