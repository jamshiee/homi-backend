export interface GeocodingResult {
  locality: string;
  district: string;
  displayAddress: string;
  latitude: number;
  longitude: number;
}

export interface IGeocodingProvider {
  search(query: string): Promise<GeocodingResult[]>;
  reverse(lat: number, lon: number): Promise<GeocodingResult | null>;
}
