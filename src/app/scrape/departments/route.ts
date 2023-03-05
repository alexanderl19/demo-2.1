import { NextResponse } from "next/server";
import { request, gql } from "graphql-request";
import { supabase } from "@/utils/supabase-secret";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development")
    throw new Error("This endpoint is only available in development.");

  const query = gql`
    {
      allCourses {
        department
        department_name
        school
      }
    }
  `;

  const { data: schoolsData, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name");

  const schoolsMap = new Map<string, string>(
    schoolsData?.map((school) => [school.name, school.id])
  );

  if (schoolsError) throw new Error("Failed to fetch schools.");

  const courses = await request<{
    allCourses: {
      department: string;
      department_name: string;
      school: string;
    }[];
  }>("https://api.peterportal.org/graphql/", query);

  const departments = Array.from(
    new Map(
      courses.allCourses.map((course) => [
        course.department_name,
        {
          name: course.department_name ?? null,
          code: course.department ?? null,
          school_id: schoolsMap.get(course.school) ?? null,
        },
      ])
    ).values()
  );

  const { data, error } = await supabase
    .from("departments")
    .upsert(departments, {
      ignoreDuplicates: false,
      onConflict: "name",
    })
    .select();

  return NextResponse.json({
    departments,
    data,
    error,
  });
}
