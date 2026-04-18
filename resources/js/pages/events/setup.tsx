import { Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Setup() {
    return (
        <div className="flex flex-col flex-1 p-8 bg-[#fafafa] min-h-screen">
            <Head title="Event Setup" />
            
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Event Setup</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Calendar Placeholder */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]">
                        <p className="text-slate-400 font-medium">[ Calendar Component Placeholder ]</p>
                    </div>

                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Event Title</Label>
                            <Input 
                                placeholder="e.g. The Vernissage 2024" 
                                className="bg-slate-200 border-none h-12 text-md px-4 rounded-md shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Event Scope</Label>
                                <select className="bg-slate-200 border-none h-12 text-md px-4 rounded-md shadow-inner w-full text-slate-700 outline-none">
                                    <option>University Wide</option>
                                    <option>College Wide</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proposed Date</Label>
                                <Input 
                                    placeholder="mm/dd/yyyy" 
                                    className="bg-slate-200 border-none h-12 text-md px-4 rounded-md shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</Label>
                            <textarea 
                                placeholder="Articulate the purpose and vision of this event..."
                                className="bg-slate-200 border-none text-md p-4 rounded-md shadow-inner min-h-[120px] w-full outline-none"
                            ></textarea>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Program Outline</Label>
                            <textarea 
                                placeholder="List the sequence of events or key segments..."
                                className="bg-slate-200 border-none text-md p-4 rounded-md shadow-inner min-h-[120px] w-full outline-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Sidebar Events Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Events</h2>
                        <ul className="space-y-3 font-medium text-slate-700">
                            <li>College night</li>
                            <li>uweek</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

Setup.layout = {
    breadcrumbs: [
        {
            title: 'Events',
            href: '#',
        },
        {
            title: 'Setup',
            href: '/events/setup',
        },
    ],
};
