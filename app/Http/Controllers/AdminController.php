<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function users()
    {
        $users = User::where('is_approved', false)
            ->where('is_admin', false)
            ->get();

        return Inertia::render('admin/users', [
            'users' => $users,
        ]);
    }

    public function approve(User $user)
    {
        $user->update(['is_approved' => true]);

        return redirect()->back()->with('status', 'User approved successfully.');
    }

    public function reject(User $user)
    {
        $user->delete();

        return redirect()->back()->with('status', 'User rejected and removed.');
    }
}
