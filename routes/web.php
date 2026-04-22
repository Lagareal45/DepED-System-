<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\TripTicketController;
use App\Http\Controllers\GasSlipController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    if (auth()->user()->is_admin) {
        return redirect()->route('admin.users');
    }
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('trip-tickets', function () {
    return Inertia::render('trip-tickets');
})->middleware(['auth', 'verified'])->name('trip-tickets.index');

Route::get('gas-slips', function () {
    return Inertia::render('gas-slips');
})->middleware(['auth', 'verified'])->name('gas-slips.index');


Route::get('monthly-report', function () {
    return Inertia::render('monthly-report');
})->middleware(['auth', 'verified'])->name('monthly-report.index');

Route::get('fuel-usage-summary', function () {
    return Inertia::render('fuel-usage-summary');
})->middleware(['auth', 'verified'])->name('fuel-usage-summary.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('trip-tickets/next-number', [TripTicketController::class, 'nextNumber'])->name('trip-tickets.next-number');
    Route::post('trip-tickets', [TripTicketController::class, 'store'])->name('trip-tickets.store');
    Route::get('trip-tickets/monthly-report', [TripTicketController::class, 'monthlyReport'])->name('trip-tickets.monthly-report');
    
    Route::get('gas-slips/next-number', [GasSlipController::class, 'nextNumber'])->name('gas-slips.next-number');
    Route::get('gas-slips/search', [GasSlipController::class, 'search'])->name('gas-slips.search');
    Route::get('gas-slips/monthly', [GasSlipController::class, 'monthly'])->name('gas-slips.monthly');
    Route::get('gas-slips/latest-odometer', [GasSlipController::class, 'latestOdometer'])->name('gas-slips.latest-odometer');
    Route::get('gas-slips/{documentNo}', [GasSlipController::class, 'getByDocumentNo'])->name('gas-slips.getByDocumentNo');
    Route::post('gas-slips', [GasSlipController::class, 'store'])->name('gas-slips.store');
    
    // Dashboard Data API
    Route::get('api/dashboard/data', [DashboardController::class, 'getData'])->name('api.dashboard.data');
    
    // Drafts API
    Route::get('drafts', [App\Http\Controllers\DraftController::class, 'index'])->name('drafts.index');
    Route::post('drafts', [App\Http\Controllers\DraftController::class, 'store'])->name('drafts.store');
    Route::delete('drafts/{draft}', [App\Http\Controllers\DraftController::class, 'destroy'])->name('drafts.destroy');
});

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->group(function () {
    Route::get('users', [AdminController::class, 'users'])->name('admin.users');
    Route::post('users/{user}/approve', [AdminController::class, 'approve'])->name('admin.users.approve');
    Route::delete('users/{user}/reject', [AdminController::class, 'reject'])->name('admin.users.reject');
    Route::patch('users/{user}', [AdminController::class, 'update'])->name('admin.users.update');
    Route::delete('users/{user}', [AdminController::class, 'destroy'])->name('admin.users.destroy');
});

require __DIR__.'/settings.php';
