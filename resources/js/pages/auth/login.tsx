import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

export default function Login() {
    return (
        <div className="relative min-h-screen bg-white">
            <Head title="Log in">
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {/* Base Background Image with Blue Overlay (visible on all screens) */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(41, 58, 138, 0.7), rgba(41, 58, 138, 0.7)), url("/bg.JPG")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />


            {/* Center column with the login card — placed above background */}
            <div className="relative z-10 flex min-h-screen items-center">
                <div className="flex w-full items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="overflow-hidden rounded-[2rem] border bg-white shadow-2xl">
                            <div className="border-b bg-gradient-to-r from-[#293a8a]/10 to-white px-10 py-8">
                                <div className="flex items-center gap-4">
                                    <img
                                        src="/favicon.ico"
                                        alt="CCFP logo"
                                        className="h-16 w-16 object-contain"
                                    />
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-[#293a8a]">
                                            CCFP Points System
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Sign in to manage points and
                                            attendance
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10">
                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="flex flex-col gap-6"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-6">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="email"
                                                        className="font-semibold text-slate-700"
                                                    >
                                                        Email Address
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="name@institution.edu"
                                                        className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-black"
                                                    />
                                                    <InputError
                                                        message={errors.email}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <Label
                                                            htmlFor="password"
                                                            className="font-semibold text-slate-700"
                                                        >
                                                            Password
                                                        </Label>
                                                    </div>

                                                    <PasswordInput
                                                        id="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="********"
                                                        className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-black"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.password
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="text-md mt-4 w-full rounded-lg bg-[#293a8a] py-3 text-white shadow-md hover:bg-[#293a8a]/90"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                >
                                                    {processing && <Spinner />}
                                                    Log In{' '}
                                                    <span className="ml-2">
                                                        →
                                                    </span>
                                                </Button>
                                            </div>

                                            <div className="mt-4 text-center text-sm text-slate-500">
                                                Need access?{' '}
                                                <TextLink
                                                    href="#"
                                                    tabIndex={5}
                                                    className="text-[#293a8a]"
                                                >
                                                    Request an Account
                                                </TextLink>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// We remove the default layout assignments that force explicit titles to use the clean container.
