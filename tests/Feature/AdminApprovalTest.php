<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AdminApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin()
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_approved' => true,
        ]);
    }

    protected function createUser($approved = false)
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_approved' => $approved,
        ]);
    }

    public function test_unapproved_user_cannot_login()
    {
        $user = $this->createUser(false);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors(['email' => 'Your account is pending administrator approval.']);
        $this->assertGuest();
    }

    public function test_approved_user_can_login()
    {
        $user = $this->createUser(true);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($user);
    }

    public function test_non_admin_cannot_access_admin_dashboard()
    {
        $user = $this->createUser(true);

        $response = $this->actingAs($user)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_dashboard()
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/users')
            ->has('users')
        );
    }

    public function test_admin_can_approve_user()
    {
        $admin = $this->createAdmin();
        $user = $this->createUser(false);

        $response = $this->actingAs($admin)->post("/admin/users/{$user->id}/approve");

        $response->assertRedirect();
        $response->assertSessionHas('status', 'User approved successfully.');
        
        $this->assertTrue($user->fresh()->is_approved);
    }

    public function test_admin_can_reject_user()
    {
        $admin = $this->createAdmin();
        $user = $this->createUser(false);

        $response = $this->actingAs($admin)->delete("/admin/users/{$user->id}/reject");

        $response->assertRedirect();
        $response->assertSessionHas('status', 'User rejected and removed.');
        
        $this->assertNull(User::find($user->id));
    }
}
