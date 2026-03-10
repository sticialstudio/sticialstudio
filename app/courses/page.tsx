import React from 'react'

type Course = {
  id: string
  title: string
  description?: string
}

const courses: Course[] = [
  { id: 'arduino-basics', title: 'Arduino Basics', description: 'Introduction to Arduino essentials' },
  { id: 'sensors-actuators', title: 'Sensors and Actuators', description: 'Learn sensors and output devices' },
  { id: 'robotics-projects', title: 'Robotics Projects', description: 'Build simple robots' },
]

export default function CoursesPage() {
  return (
    <section className="p-6 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Courses</h1>
      <p className="mb-6 text-slate-700 dark:text-slate-300">Browse available courses and enroll.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="p-4 border rounded-lg bg-white dark:bg-slate-800/60 shadow-sm">
            <h3 className="font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{c.description}</p>
            <button className="px-3 py-1 rounded bg-brand-500 text-white">Open</button>
          </div>
        ))}
      </div>
    </section>
  )
}
