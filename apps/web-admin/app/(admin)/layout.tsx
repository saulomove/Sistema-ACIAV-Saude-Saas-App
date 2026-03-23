import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden w-full bg-slate-50">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
