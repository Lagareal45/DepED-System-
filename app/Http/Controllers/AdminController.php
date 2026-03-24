<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function users()
    {
        $pendingUsers = User::where('is_approved', false)
            ->where('is_admin', false)
            ->get();

        $allUsers = User::where('id', '!=', auth()->id())->get();

        return Inertia::render('admin/users', [
            'pendingUsers' => $pendingUsers,
            'allUsers' => $allUsers,
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

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'is_approved' => 'boolean',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->back()->with('status', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return redirect()->back()->with('status', 'User deleted successfully.');
    }
}
