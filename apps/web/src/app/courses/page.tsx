import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function CoursesPlaceholderPage() {
    return (
        <MainLayout>
            <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-500 relative">
                <Link
                    href="/"
                    className="absolute top-8 left-8 flex items-center text-slate-400 hover:text-accent transition-colors group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>
                <div className="w-24 h-24 bg-panel border-2 border-dashed border-panel-border rounded-full flex items-center justify-center mb-6 text-slate-500">
                    <Construction size={40} />
                </div>
                <h1 className="text-3xl font-bold mb-4">Course Curriculum LMS</h1>
                <p className="text-slate-400 max-w-md text-center">
                    This section is currently under construction. Please check back later for interactive guided lessons and curriculum mapping.
                </p>
            </div>
        </MainLayout>
    );
}
