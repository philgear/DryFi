import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface WeatherData {
  metric: number | null;
  metric_qualifier: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  current_rm_temp = signal<WeatherData>({ name: "Current Room Temperature", metric_qualifier: '° F', metric: null });
  current_rm_humidity = signal<WeatherData>({ name: "Current Humidity", metric_qualifier: '%', metric: null });
  current_ext_temp = signal<WeatherData>({ name: "Current External Temperature", metric_qualifier: '° F', metric: null });
  current_ext_humidity = signal<WeatherData>({ name: "Current External Humidity", metric_qualifier: '%', metric: null });
  current_precip = signal<WeatherData>({ name: "Probability of Precipitation", metric_qualifier: '%', metric: null });
  current_wind = signal<WeatherData>({ name: "Current Wind Speed", metric_qualifier: 'mph', metric: null });
  current_pressure = signal<WeatherData>({ name: "Atmospheric Pressure", metric_qualifier: 'hPa', metric: null });
  current_cloud_cover = signal<WeatherData>({ name: "Cloud Cover", metric_qualifier: '%', metric: null });
  current_feels_like = signal<WeatherData>({ name: "Feels Like", metric_qualifier: '° F', metric: null });
  current_visibility = signal<WeatherData>({ name: "Visibility", metric_qualifier: 'mi', metric: null });
  current_weather_desc = signal<string>('—');
  error = signal<string | null>(null);

  // Future 12-hour forecasting nodes (3h, 6h, 9h, 12h)
  forecastArray = signal<{dt: Date, temp: number, humidity: number}[]>([]);

  constructor(private http: HttpClient) {}

  geocode(query: string) {
    const isZip = /^\d{5}$/.test(query.trim());
    if (isZip) {
      return this.http.get<any>(`https://api.openweathermap.org/geo/1.0/zip?zip=${query.trim()},US&appid=${environment.OPEN_WEATHER_KEY}`);
    } else {
      return this.http.get<any>(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.trim())}&limit=1&appid=${environment.OPEN_WEATHER_KEY}`);
    }
  }

  fetchData(lat: number = environment.SITE_LAT, lon: number = environment.SITE_LON) {
    this.http.get<any>(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${environment.OPEN_WEATHER_KEY}`)
      .subscribe({
        next: (res) => {
          const d = res.list[0];
          const ext_humidity = Number(d.main.humidity);
          const ext_temp = Number(d.main.temp);
          const wind = Number(d.wind.speed);
          const pop = Number(d.pop || 0) * 100;
          const pressure = Number(d.main.pressure);
          const cloud_cover = Number(d.clouds?.all ?? 0);
          const feels_like = Number(d.main.feels_like);
          const visibility_m = Number(d.visibility ?? 10000);
          const visibility_mi = Math.round(visibility_m / 1609.34 * 10) / 10;
          const weather_desc = d.weather?.[0]?.description ?? '—';

          // Extract the next 12 hours of chronological forecast data natively
          const futureForecasts = res.list.slice(1, 5).map((node: any) => ({
            dt: new Date(node.dt * 1000),
            temp: Number(node.main.temp),
            humidity: Number(node.main.humidity)
          }));
          this.forecastArray.set(futureForecasts);

          this.current_ext_humidity.update(v => ({ ...v, metric: ext_humidity }));
          this.current_ext_temp.update(v => ({ ...v, metric: ext_temp }));
          this.current_precip.update(v => ({ ...v, metric: pop }));
          this.current_wind.update(v => ({ ...v, metric: wind }));
          this.current_pressure.update(v => ({ ...v, metric: pressure }));
          this.current_cloud_cover.update(v => ({ ...v, metric: cloud_cover }));
          this.current_feels_like.update(v => ({ ...v, metric: feels_like }));
          this.current_visibility.update(v => ({ ...v, metric: visibility_mi }));
          this.current_weather_desc.set(weather_desc);
        },
        error: (err) => this.error.set(err.message)
      });

    if (!environment.IOT_ENDPOINT_URL.startsWith('http') || environment.IOT_KEY === 'fake-api-key') {
      this.error.set("Interior telemetry offline: IOT_ENDPOINT_URL and IOT_KEY not configured in .env");
    } else {
      this.http.get<any>(`${environment.IOT_ENDPOINT_URL}/temperature?x-aio-key=${environment.IOT_KEY}`)
        .subscribe({
          next: (res) => this.current_rm_temp.update(v => ({ ...v, metric: Number(res.last_value) })),
          error: (err) => this.error.set(err.message)
        });

      this.http.get<any>(`${environment.IOT_ENDPOINT_URL}/humidity?x-aio-key=${environment.IOT_KEY}`)
        .subscribe({
          next: (res) => this.current_rm_humidity.update(v => ({ ...v, metric: Number(res.last_value) })),
          error: (err) => this.error.set(err.message)
        });
    }
  }
}
