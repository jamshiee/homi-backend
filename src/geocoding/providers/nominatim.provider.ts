import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  GeocodingResult,
  IGeocodingProvider,
} from './geocoding-provider.interface';
import { normalizeDistrict } from '../geocoding.utils';

@Injectable()
export class NominatimProvider implements IGeocodingProvider {
  private readonly logger = new Logger(NominatimProvider.name);

  // Lightweight in-memory cache to respect Nominatim's strict usage limits
  private readonly cache = new Map<
    string,
    { data: GeocodingResult[]; expiresAt: number }
  >();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private readonly USER_AGENT = 'HomiHoldings/1.0 (contact@homiholdings.com)';

  async search(query: string): Promise<GeocodingResult[]> {
    const cleanQuery = query?.trim().toLowerCase();
    if (!cleanQuery) return [];

    const cached = this.cache.get(cleanQuery);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    try {
      this.logger.log(`Nominatim search: "${query}"`);
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 10,
            countrycodes: 'in',
          },
          headers: { 'User-Agent': this.USER_AGENT },
          timeout: 5000,
        },
      );

      if (!Array.isArray(response.data)) return [];

      const results: GeocodingResult[] = [];

      for (const item of response.data) {
        const address = item.address || {};
        const state = address.state || '';

        // Strictly filter to Kerala
        if (!state.toLowerCase().includes('kerala')) continue;

        const locality =
          address.neighbourhood ||
          address.suburb ||
          address.village ||
          address.town ||
          address.city ||
          address.municipality ||
          address.locality ||
          '';

        const rawDistrict =
          address.state_district || address.district || address.county || '';

        results.push({
          locality,
          district: normalizeDistrict(rawDistrict),
          displayAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        });
      }

      this.cache.set(cleanQuery, {
        data: results,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return results;
    } catch (error) {
      this.logger.error(`Nominatim search failed: "${query}"`, error.message);
      return [];
    }
  }

  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    const cacheKey = `rev_${lat.toFixed(5)}_${lon.toFixed(5)}`;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data[0] || null;

    try {
      this.logger.log(`Nominatim reverse: [${lat}, ${lon}]`);
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: { lat, lon, format: 'json', addressdetails: 1 },
          headers: { 'User-Agent': this.USER_AGENT },
          timeout: 5000,
        },
      );

      const item = response.data;
      if (!item?.address) return null;

      const address = item.address;

      const locality =
        address.neighbourhood ||
        address.suburb ||
        address.village ||
        address.town ||
        address.city ||
        address.municipality ||
        address.locality ||
        '';

      const rawDistrict =
        address.state_district || address.district || address.county || '';

      const result: GeocodingResult = {
        locality,
        district: normalizeDistrict(rawDistrict),
        displayAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };

      this.cache.set(cacheKey, {
        data: [result],
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Nominatim reverse failed: [${lat}, ${lon}]`,
        error.message,
      );
      return null;
    }
  }
}
