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
        title
        number
        description
      }
    }
  `;

  const { data: departmentsData, error: departmentsError } = await supabase
    .from("departments")
    .select("id, code");

  const departmentsMap = new Map<string, string>(
    departmentsData?.map((department) => [department.code, department.id])
  );

  if (departmentsError) throw new Error("Failed to fetch departments.");

  const courses = await request<{
    allCourses: {
      department: string;
      number: string;
      title: string;
      description: string;
    }[];
  }>("https://api.peterportal.org/graphql/", query);

  const { data, error } = await supabase
    .from("courses")
    .upsert(
      courses.allCourses.map((course) => ({
        title: course.title,
        department_id: departmentsMap.get(course.department),
        number: course.number,
        description: course.description ?? null,
      })),
      {
        ignoreDuplicates: false,
        onConflict: "department_id, number",
      }
    )
    .select();

  return NextResponse.json({
    courses,
    data,
    error,
  });
}
