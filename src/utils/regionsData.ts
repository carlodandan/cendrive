import regionsJson from "../data/regions.json";

/** Raw shapes as published in `src/data/lgu/*.json` (snake_case, PSA wording). */
interface RawCity {
  city: string;
  zip_code?: string;
}

interface RawMunicipality {
  municipality: string;
  zip_code?: string;
}

interface RawProvince {
  province: string;
  cities?: RawCity[];
  municipalities?: RawMunicipality[];
}

interface RawRegionFile {
  slug: string;
  provinces?: RawProvince[];
  cities?: RawCity[];
  municipalities?: RawMunicipality[];
}

export interface Region {
  name: string;
  slug: string;
}

export type RegionKind = "province-based" | "city-municipality-based";

export interface Locality {
  name: string;
  kind: "city" | "municipality";
  /** Verbatim from the dataset; some entries are ranges such as "1400-1413". */
  zipCode: string | null;
}

export interface Province {
  name: string;
  localities: Locality[];
}

export interface RegionData {
  slug: string;
  kind: RegionKind;
  provinces: Province[];
}

export const REGIONS: Region[] = regionsJson as Region[];

/**
 * Regions without provinces still need one entry in the province select so the
 * form keeps a single shape. These are the same stand-in names the Electron
 * build used.
 */
const DUMMY_PROVINCE: Record<string, string> = {
  "national-capital-region": "Metro Manila",
  "special-geographic-area": "Special Geographic Area",
};

function dummyProvinceName(slug: string): string {
  return DUMMY_PROVINCE[slug] ?? slug.replace(/-/g, " ").toUpperCase();
}

// Vite turns this into one lazy chunk per region file, so only the region the
// user picks is fetched.
const regionFiles = import.meta.glob<RawRegionFile>("../data/lgu/*.json", {
  import: "default",
});

const loaders = new Map<string, () => Promise<RawRegionFile>>();
for (const [path, loader] of Object.entries(regionFiles)) {
  const slug = path.split("/").pop()?.replace(/\.json$/, "");
  if (slug) loaders.set(slug, loader);
}

const cache = new Map<string, RegionData>();
const inFlight = new Map<string, Promise<RegionData>>();

function toLocalities(source: RawProvince | RawRegionFile): Locality[] {
  const cities: Locality[] = (source.cities ?? []).map((entry) => ({
    name: entry.city,
    kind: "city" as const,
    zipCode: entry.zip_code ?? null,
  }));
  const municipalities: Locality[] = (source.municipalities ?? []).map((entry) => ({
    name: entry.municipality,
    kind: "municipality" as const,
    zipCode: entry.zip_code ?? null,
  }));
  return [...cities, ...municipalities].sort((a, b) => a.name.localeCompare(b.name));
}

function normalize(slug: string, raw: RawRegionFile): RegionData {
  if (Array.isArray(raw.provinces) && raw.provinces.length > 0) {
    return {
      slug,
      kind: "province-based",
      provinces: raw.provinces
        .map((province) => ({
          name: province.province,
          localities: toLocalities(province),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  return {
    slug,
    kind: "city-municipality-based",
    provinces: [{ name: dummyProvinceName(slug), localities: toLocalities(raw) }],
  };
}

export function hasRegionData(slug: string): boolean {
  return loaders.has(slug);
}

/** Loads and caches a region; concurrent callers share one request. */
export function loadRegion(slug: string): Promise<RegionData> {
  const cached = cache.get(slug);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(slug);
  if (pending) return pending;

  const loader = loaders.get(slug);
  if (!loader) {
    return Promise.reject(new Error(`No local government data for region "${slug}".`));
  }

  const request = loader()
    .then((raw) => {
      const data = normalize(slug, raw);
      cache.set(slug, data);
      inFlight.delete(slug);
      return data;
    })
    .catch((error: unknown) => {
      inFlight.delete(slug);
      throw error;
    });

  inFlight.set(slug, request);
  return request;
}

export function findProvince(data: RegionData, name: string): Province | undefined {
  return data.provinces.find((province) => province.name === name);
}

export function findLocality(
  data: RegionData,
  provinceName: string,
  localityName: string,
): Locality | undefined {
  return findProvince(data, provinceName)?.localities.find(
    (locality) => locality.name === localityName,
  );
}
