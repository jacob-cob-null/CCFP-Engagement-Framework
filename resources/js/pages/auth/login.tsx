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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Head title="Log in" />

            {/* Tabs scaffolding */}
            <div className="flex border-b text-sm font-medium text-center">
                <button className="flex-1 py-4 border-b-2 border-indigo-900 text-indigo-900 bg-slate-50 relative z-10 -mb-[1px]">
                    College Representative
                </button>
                <button className="flex-1 py-4 text-slate-500 bg-slate-100 border-b relative z-0">
                    CCFP
                </button>
            </div>

            <div className="p-8">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="font-semibold text-slate-700">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="name@institution.edu"
                                        className="bg-slate-100 border-none shadow-none text-black"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password" className="font-semibold text-slate-700">Password</Label>
                                        <TextLink
                                            href="#"
                                            className="ml-auto text-sm text-indigo-900"
                                            tabIndex={5}
                                        >
                                            Forgot Password?
                                        </TextLink>
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="********"
                                        className="bg-slate-100 border-none shadow-none text-black"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                        className="border-slate-300"
                                    />
                                    <Label htmlFor="remember" className="font-normal text-slate-600">Remember Me</Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-4 w-full bg-indigo-950 hover:bg-indigo-900 text-white rounded shadow text-md py-6"
                                    tabIndex={4}
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Log In <span>&rarr;</span>
                                </Button>
                            </div>

                            <div className="text-center text-sm mt-4 text-slate-500">
                                Need access?{' '}
                                <TextLink href="#" tabIndex={5} className="text-indigo-900">
                                    Request an Account
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
}

// We remove the default layout assignments that force explicit titles to use the clean container.
