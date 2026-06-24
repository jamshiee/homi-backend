import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  GeocodingResult,
  IGeocodingProvider,
} from './geocoding-provider.interface';
import { normalizeDistrict } from '../geocoding.utils';

/**
 * Mapbox Geocoding API v6 provider.
 * Docs: https://docs.mapbox.com/api/search/geocoding/
 *
 * Set MAPBOX_ACCESS_TOKEN in your .env to use this provider.
 * Set GEOCODING_PROVIDER=mapbox in your .env to activate it.
 */
@Injectable()
export class MapboxProvider implements IGeocodingProvider {
  private readonly logger = new Logger(MapboxProvider.name);
  private readonly token: string;

  // Optional cache — Mapbox has higher rate limits but caching is still good
  private readonly cache = new Map<
    string,
    { data: GeocodingResult[]; expiresAt: number }
  >();
  private readonly CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('MAPBOX_ACCESS_TOKEN') ?? '';
    if (!this.token) {
      this.logger.warn(
        'MAPBOX_ACCESS_TOKEN is not set. MapboxProvider will return empty results.',
      );
    }
  }

  async search(query: string): Promise<GeocodingResult[]> {
    if (!this.token) return [];

    const cleanQuery = query?.trim().toLowerCase();
    if (!cleanQuery) return [];

    const cached = this.cache.get(cleanQuery);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    try {
      this.logger.log(`Mapbox forward geocode: "${query}"`);

      const response = await axios.get(
        'https://api.mapbox.com/search/geocode/v6/forward',
        {
          params: {
            q: query,
            country: 'IN',
            // Bias results towards Kerala bounding box (rough bounds)
            bbox: '74.85,8.07,77.63,12.79',
            limit: 10,
            access_token: this.token,
          },
          timeout: 5000,
        },
      );

      const features: any[] = response.data?.features ?? [];
      const results: GeocodingResult[] = [];

      for (const feature of features) {
        const ctx = feature.properties?.context ?? {};
        const region: string = ctx.region?.name ?? '';

        // Filter to Kerala only
        if (!region.toLowerCase().includes('kerala')) continue;

        const locality =
          ctx.neighborhood?.name ||
          ctx.locality?.name ||
          ctx.place?.name ||
          '';

        const rawDistrict = ctx.district?.name || ctx.place?.name || '';

        results.push({
          locality,
          district: normalizeDistrict(rawDistrict),
          displayAddress: feature.properties?.full_address ?? '',
          latitude: feature.geometry?.coordinates?.[1] ?? 0,
          longitude: feature.geometry?.coordinates?.[0] ?? 0,
        });
      }

      this.cache.set(cleanQuery, {
        data: results,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return results;
    } catch (error) {
      this.logger.error(`Mapbox forward geocode failed: "${query}"`, error.message);
      return [];
    }
  }

  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    if (!this.token) return null;

    const cacheKey = `rev_${lat.toFixed(5)}_${lon.toFixed(5)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data[0] || null;

    try {
      this.logger.log(`Mapbox reverse geocode: [${lat}, ${lon}]`);

      const response = await axios.get(
        'https://api.mapbox.com/search/geocode/v6/reverse',
        {
          params: {
            latitude: lat,
            longitude: lon,
            country: 'IN',
            access_token: this.token,
          },
          timeout: 5000,
        },
      );

      const feature = response.data?.features?.[0];
      if (!feature) return null;

      const ctx = feature.properties?.context ?? {};

      const locality =
        ctx.neighborhood?.name ||
        ctx.locality?.name ||
        ctx.place?.name ||
        '';

      const rawDistrict = ctx.district?.name || ctx.place?.name || '';

      const result: GeocodingResult = {
        locality,
        district: normalizeDistrict(rawDistrict),
        displayAddress: feature.properties?.full_address ?? '',
        latitude: feature.geometry?.coordinates?.[1] ?? lat,
        longitude: feature.geometry?.coordinates?.[0] ?? lon,
      };

      this.cache.set(cacheKey, {
        data: [result],
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Mapbox reverse geocode failed: [${lat}, ${lon}]`,
        error.message,
      );
      return null;
    }
  }
}
