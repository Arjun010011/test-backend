export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                CP
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    Candidate Portal
                </span>
            </div>
        </>
    );
}
