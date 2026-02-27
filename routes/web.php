<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\TripTicketController;
use App\Http\Controllers\GasSlipController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
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
    Route::get('gas-slips/{documentNo}', [GasSlipController::class, 'getByDocumentNo'])->name('gas-slips.getByDocumentNo');
    Route::post('gas-slips', [GasSlipController::class, 'store'])->name('gas-slips.store');
});

require __DIR__.'/settings.php';
