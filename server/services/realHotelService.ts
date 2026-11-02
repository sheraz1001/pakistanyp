import fetch from 'node-fetch';

interface RealHotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  currency: string;
  limit: number;
}

interface RealHotel {
  locationId: number;
  hotelId: number;
  hotelName: string;
  priceFrom: number;
  priceAvg: number;
  stars: number;
  location: {
    name: string;
    country: string;
    state?: string;
    geo: {
      lat: number;
      lon: number;
    };
  };
  pricePercentile: {
    3: number;
    10: number;
    35: number;
    50: number;
    75: number;
    99: number;
  };
}

export class RealHotelService {
  private apiToken: string;
  private baseUrl = 'https://engine.hotellook.com';

  constructor() {
    this.apiToken = process.env.TRAVELPAYOUTS_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('Travelpayouts API token not configured');
    }
  }

  async searchRealHotels(params: RealHotelSearchParams): Promise<RealHotel[]> {
    try {
      if (!this.apiToken) {
        throw new Error('Travelpayouts API token not configured');
      }

      const url = new URL('/api/v2/cache.json', this.baseUrl);
      url.searchParams.append('location', params.location);
      url.searchParams.append('checkIn', params.checkIn);
      url.searchParams.append('checkOut', params.checkOut);
      url.searchParams.append('adults', params.adults.toString());
      url.searchParams.append('limit', params.limit.toString());
      url.searchParams.append('token', this.apiToken);

      console.log(`🏨 Real Hotel API Request: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PakistanYP-Hotel-Platform/1.0',
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as RealHotel[];
      console.log(`🏨 Real Hotel API Response: Found ${data.length} hotels`);

      return data;
    } catch (error) {
      console.error('Real hotel search failed:', error);
      return [];
    }
  }

  // Create booking link for hotel
  getBookingLink(hotelId: number, checkIn: string, checkOut: string, adults: number = 2, children: number = 0): string {
    const params = new URLSearchParams({
      hotelId: hotelId.toString(),
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      token: this.apiToken,
      marker: '428110' // Affiliate marker
    });

    return `https://www.hotellook.com/hotels/${hotelId}?${params.toString()}`;
  }

  // Get hotel photos
  async getHotelPhotos(hotelId: number): Promise<string[]> {
    try {
      const url = new URL('/api/v2/static/photos.json', this.baseUrl);
      url.searchParams.append('hotelId', hotelId.toString());
      url.searchParams.append('token', this.apiToken);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { photoId: string; url: string }[];
      return data.map(photo => photo.url);
    } catch (error) {
      console.error('Failed to get hotel photos:', error);
      return [];
    }
  }

  // Get hotel amenities and details
  async getHotelDetails(hotelId: number): Promise<any> {
    try {
      const url = new URL('/api/v2/static/hotels.json', this.baseUrl);
      url.searchParams.append('hotelId', hotelId.toString());
      url.searchParams.append('token', this.apiToken);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get hotel details:', error);
      return null;
    }
  }
}

export const realHotelService = new RealHotelService();