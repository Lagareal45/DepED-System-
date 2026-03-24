import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="icon" href="/DepED%20Buk_Logov2.png" type="image/png" />
                <link rel="shortcut icon" href="/DepED%20Buk_Logov2.png" type="image/png" />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div
                className="relative flex min-h-screen flex-col items-center bg-cover bg-center bg-no-repeat p-6 text-[#1b1b18] lg:justify-center lg:p-8"
                style={{ backgroundImage: "url('/bg-image.png')" }}
            >
                {/* Backdrop overlay for blur and slight darkness to highlight content */}
                <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-sm dark:bg-black/40"></div>

                <header className="relative z-10 mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >

                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="relative z-10 flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 flex flex-col items-center text-center rounded-br-lg rounded-bl-lg bg-white/70 backdrop-blur-md p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-black/30 dark:backdrop-blur-md dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <AppLogoIcon className="mb-4 h-24 w-24 mx-auto" />
                            <h1 className="mb-2 text-2xl font-bold">
                                Vehicle Monitoring System
                            </h1>
                            <p className="mb-6 text-lg text-[#706f6c] dark:text-[#A1A09A]">
                                Track trips. Monitor fuel. Generate reports.
                            </p>

                        </div>
                        <div className="relative -mb-px aspect-[335/376] w-full shrink-0 overflow-hidden rounded-t-lg bg-[#fff2f2] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D0002]">
                            <img
                                src="/DepEd-WelcomePage.png"
                                alt="DepEd Welcome Page"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]" />
                        </div>
                    </main>
                </div>
                <div className="relative z-10 hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
