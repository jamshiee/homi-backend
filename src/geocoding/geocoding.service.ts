import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodingResult } from './providers/geocoding-provider.interface';
import { NominatimProvider } from './providers/nominatim.provider';
import { MapboxProvider } from './providers/mapbox.provider';


/**
 * GeocodingService is a thin facade that delegates to the active provider.
 *
 * Provider is selected by the GEOCODING_PROVIDER environment variable:
 *   - "mapbox"   (default)  — production-ready, requires MAPBOX_ACCESS_TOKEN
 *   - "nominatim"  — free, rate-limited, good for development
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly nominatim: NominatimProvider,
    private readonly mapbox: MapboxProvider,
    private readonly config: ConfigService,
  ) {
    const providerName =
      this.config.get<string>('GEOCODING_PROVIDER') ?? 'nominatim';
    this.logger.log(`Active geocoding provider: ${providerName}`);
  }

  private get provider() {
    const name = this.config.get<string>('GEOCODING_PROVIDER') ?? 'nominatim';
    return name === 'mapbox' ? this.mapbox : this.nominatim;
  }

  async search(query: string): Promise<GeocodingResult[]> {
    return this.provider.search(query);
  }

  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    return this.provider.reverse(lat, lon);
  }
}
