import { CoursesCatalogView } from '@/components/courses/CoursesCatalogView';
import { getCourseCatalog } from '@/lib/courses/catalog';

export default function CoursesPage() {
  const tracks = getCourseCatalog();

  return <CoursesCatalogView tracks={tracks} />;
}

