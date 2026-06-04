import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodingResult {
  locality: string;
  district: string;
  displayAddress: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  
  // Lightweight in-memory cache to respect Nominatim's strict usage limits
  private readonly cache = new Map<string, { data: GeocodingResult[]; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours caching

  private readonly USER_AGENT = 'HomiHoldings/1.0 (contact@homiholdings.com)';

  private normalizeDistrict(name: string): string {
    let cleaned = name.replace(/\s+district/gi, '').trim();
    const lower = cleaned.toLowerCase();
    
    // Map common misspellings or alternative names to standard Expo names
    const mapping: Record<string, string> = {
      'kasargod': 'Kasaragod',
      'kasaragod': 'Kasaragod',
      'trivandrum': 'Thiruvananthapuram',
      'thiruvananthapuram': 'Thiruvananthapuram',
      'calicut': 'Kozhikode',
      'kozhikode': 'Kozhikode',
      'cochin': 'Ernakulam',
      'ernakulam': 'Ernakulam',
      'palghat': 'Palakkad',
      'palakkad': 'Palakkad',
      'cannanore': 'Kannur',
      'kannur': 'Kannur',
      'trichur': 'Thrissur',
      'thrissur': 'Thrissur',
      'alleppey': 'Alappuzha',
      'alappuzha': 'Alappuzha',
      'quilon': 'Kollam',
      'kollam': 'Kollam',
    };
    
    return mapping[lower] || cleaned;
  }

  async search(query: string): Promise<GeocodingResult[]> {
    const cleanQuery = query?.trim().toLowerCase();
    if (!cleanQuery) return [];

    console.log('Nominatim search query:', cleanQuery);

    // Check cache
    const cached = this.cache.get(cleanQuery);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      this.logger.log(`Searching Nominatim for query: "${query}"`);
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${query}`,
          format: 'json',
          addressdetails: 1,
          limit: 10,
          countrycodes: 'in',
        },
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        timeout: 5000,
      });

      console.log('Nominatim search response:', response.data);

      if (!Array.isArray(response.data)) {
        return [];
      }

      const results: GeocodingResult[] = [];

      for (const item of response.data) {
        const address = item.address || {};
        const state = address.state || '';
        
        // Strictly filter to Kerala to ensure Malabar domain accuracy
        if (!state.toLowerCase().includes('kerala')) {
          continue;
        }

        const locality =
          address.neighbourhood ||
          address.suburb ||
          address.village ||
          address.town ||
          address.city ||
          address.municipality ||
          address.locality ||
          '';

        let rawDistrict = address.state_district || address.district || address.county || '';
        // Standardize names (e.g. Kasargod -> Kasaragod, Malappuram District -> Malappuram)
        const district = this.normalizeDistrict(rawDistrict);

        results.push({
          locality,
          district,
          displayAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        });
      }

      // Save to cache
      this.cache.set(cleanQuery, {
        data: results,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return results;
    } catch (error) {
      this.logger.error(`Nominatim search failed for query: "${query}"`, error.message);
      return [];
    }
  }

  async reverse(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `rev_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data[0] || null;
    }

    try {
      this.logger.log(`Reverse geocoding Nominatim for coordinates: [${latitude}, ${longitude}]`);
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        timeout: 5000,
      });

      const item = response.data;
      if (!item || !item.address) {
        return null;
      }
      console.log("Reverse geocoding response: ",item)

      const address = item.address;
      const state = address.state || '';

      const locality =
        address.neighbourhood ||
        address.suburb ||
        address.village ||
        address.town ||
        address.city ||
        address.municipality ||
        address.locality ||
        '';

      let rawDistrict = address.state_district || address.district || address.county || '';
      const district = this.normalizeDistrict(rawDistrict);

      const result: GeocodingResult = {
        locality,
        district,
        displayAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };

      // Save to cache
      this.cache.set(cacheKey, {
        data: [result],
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      this.logger.error(`Nominatim reverse lookup failed for [${latitude}, ${longitude}]`, error.message);
      return null;
    }
  }
}
