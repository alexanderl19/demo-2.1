import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { supabase } from "@/utils/supabase-secret";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development")
    throw new Error("This endpoint is only available in development.");

  const result = await fetch(
    new URL("https://catalogue.uci.edu/schoolsandprograms/")
  );
  let doc = parse(await result.text());

  const schools = doc
    .querySelectorAll("#textcontainer > h4 > a")
    .map((school) => ({
      name: school.textContent,
    }));

  const { data, error } = await supabase
    .from("schools")
    .upsert(schools, {
      ignoreDuplicates: false,
      onConflict: "name",
    })
    .select();

  return NextResponse.json({
    schools,
    data,
    error,
  });
}
