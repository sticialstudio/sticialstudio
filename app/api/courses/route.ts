import { NextResponse } from 'next/server'

type Course = {
  id: string
  title: string
  description?: string
}

const sampleCourses: Course[] = [
  { id: 'arduino-basics', title: 'Arduino Basics', description: 'Intro to Arduino fundamentals' },
  { id: 'sensors-actuators', title: 'Sensors and Actuators', description: 'Learn sensors and output devices' },
  { id: 'robotics-projects', title: 'Robotics Projects', description: 'Build basic robots' },
]

export async function GET() {
  return NextResponse.json({ courses: sampleCourses })
}
