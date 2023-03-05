import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { supabase } from "@/utils/supabase-secret";

export const dynamic = "force-dynamic";

const baseUrl = "http://www.myatlascms.com/map/accessible.php?id=463&cId=56435";
const baseSelector = ["body", "div", "form", "ol", "li"];

export async function GET() {
  if (process.env.NODE_ENV !== "development")
    throw new Error("This endpoint is only available in development.");

  const buildings = (await parseLevel(baseUrl, baseSelector)).flat(
    10
  ) as Awaited<ReturnType<typeof parseHeading>>[];

  const buildingsUniformShape = buildings.map(({ name, code, number }) => ({
    name: name ?? null,
    code: code ?? null,
    number: number ?? null,
  }));

  const buildingsNoDuplicatees = Array.from(
    new Map<string, typeof buildingsUniformShape[0]>(
      buildingsUniformShape.map((building) => [building.name, building])
    ).values()
  );

  const { data, error } = await supabase
    .from("buildings")
    .upsert(buildingsNoDuplicatees, {
      ignoreDuplicates: false,
      onConflict: "name",
    })
    .select();

  return NextResponse.json({
    buildings,
    data,
    error,
  });
}

const requestQueue = async <a>(promises: Promise<a>[]): Promise<a[]> =>
  await Promise.all(promises);

type ValueOrArray<T> = T | ArrayOfValueOrArray<T>;
interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {}

const parseLevel = async (
  url: string,
  selector: string[]
): Promise<ArrayOfValueOrArray<Awaited<ReturnType<typeof parseHeading>>>> => {
  const result = await fetch(new URL(url, baseUrl));
  let doc = parse(await result.text());

  const links = doc.querySelectorAll([...selector, "ol", "li", "a"].join(">"));

  if (links.length) {
    return await requestQueue(
      links.map((link) =>
        parseLevel(link.attrs.href, [...selector, "ol", "li"])
      )
    );
  } else {
    const buildings = doc.querySelectorAll(
      [...selector, "ul", "li", "a"].join(">")
    );

    return await requestQueue(
      buildings.map((building) =>
        parseHeading(building.attrs.href, [...selector, "ol", "li"])
      )
    );
  }
};

const parseHeading = async (url: string, selector: string[]) => {
  const result = await fetch(new URL(url, baseUrl).toString());
  let doc = parse(await result.text());

  const headingFragments =
    doc
      .querySelector([...selector, "h3"].join(">"))
      ?.textContent.split(/[()]/) ?? [];

  return {
    name: headingFragments[0].trim(),
    code: headingFragments[1] ?? undefined,
    number: doc.querySelector(".uci-number")?.textContent?.split(":")[1].trim(),
  };
};
