export interface Region {
  name: string;
  slug: string;
}

export interface Province {
  name: string;
  slug: string;
  hasData: boolean;
}

export interface Municipality {
  name: string;
  slug: string;
  hasZipCode: boolean;
}

export interface City {
  name: string;
  slug: string;
  hasZipCode: boolean;
}

export interface LGUData {
  provinces: Array<{
    province: string;
    municipalities: Array<{
      municipality: string;
      zip_code: string;
    }>;
    cities: Array<{
      city: string;
      zip_code: string;
    }>;
  }>;
}