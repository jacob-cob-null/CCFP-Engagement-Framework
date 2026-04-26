import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <img src="/logo.png" alt="CCFP logo" className="h-20 w-20 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-lg">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    CCFP Point System
                </span>
            </div>
        </>
    );
}
