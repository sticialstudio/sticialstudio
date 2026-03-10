import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <section className="max-w-4xl mx-auto py-8">
        <h1 className="text-4xl font-extrabold mb-4">STEMAIDE Web Studio</h1>
        <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
          Learn programming and build Arduino-based hardware projects with an integrated LMS and coding editor.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/courses" className="block bg-slate-100 dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-lg">
            <h3 className="font-semibold">Study a Course</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Browse courses and track your progress</p>
          </Link>
          <Link href="/projects" className="block bg-slate-100 dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-lg">
            <h3 className="font-semibold">Build a Project</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Guided Arduino projects</p>
          </Link>
          <Link href="/editor" className="block bg-slate-100 dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-lg">
            <h3 className="font-semibold">Code Editor</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Block and text-based coding</p>
          </Link>
        </div>
      </section>
    </main>
  )
}
