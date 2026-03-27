import { Injectable, signal, effect, inject } from '@angular/core';
import { WeatherService } from './weather.service';
import { SolarService } from './solar.service';

declare global {
  interface Window {
    createUnityInstance: (canvas: HTMLCanvasElement, config: any, onProgress?: (progress: number) => void) => Promise<any>;
    onUnityLoaded: () => void;
    onUnityPoiClicked: (poiId: string) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class UnityService {
  private weather = inject(WeatherService);
  private solar = inject(SolarService);

  private unityInstance: any = null;
  public isLoaded = signal(false);
  public loadProgress = signal(0);
  public lastClickedPoi = signal<string | null>(null);

  constructor() {
    // Expose global callbacks for Unity's JSLib
    window.onUnityLoaded = () => {
      this.isLoaded.set(true);
      console.log('[UnityService] WebGL instance loaded and ready.');
    };

    window.onUnityPoiClicked = (poiId: string) => {
      this.lastClickedPoi.set(poiId);
      console.log(`[UnityService] POI clicked: ${poiId}`);
    };

    // React to Solar/Weather changes and push to Unity automatically
    effect(() => {
      const elevation = this.solar.sunPosition().elevationDeg;
      this.sendMessageToUnity('EnvironmentManager', 'UpdateSunPosition', elevation.toString());
    });

    effect(() => {
      const currTemp = this.weather.current_ext_temp().metric;
      const clouds = this.weather.current_cloud_cover().metric;
      this.sendMessageToUnity('EnvironmentManager', 'UpdateWeather', `${currTemp},${clouds}`);
    });
  }

  /**
   * Initializes the Unity WebGL build on a given canvas.
   * @param canvas The HTMLCanvasElement to render into.
   * @param buildUrl Path to the WebGL build folder (e.g. "assets/unity-build/Build")
   */
  public initUnity(canvas: HTMLCanvasElement, buildUrl: string) {
    if (this.unityInstance) return;

    const config = {
      dataUrl: buildUrl + "/Build.data",
      frameworkUrl: buildUrl + "/Build.framework.js",
      codeUrl: buildUrl + "/Build.wasm",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "DryFi",
      productName: "ObserverGlobe",
      productVersion: "1.0",
    };

    window.createUnityInstance(canvas, config, (progress: number) => {
      this.loadProgress.set(progress * 100);
    }).then((instance: any) => {
      this.unityInstance = instance;
    }).catch((message: any) => {
      console.error('[UnityService] Error starting instance:', message);
    });
  }

  /**
   * Commands the Cesium camera to fly to a location.
   */
  public flyToLocation(lat: number, lon: number, height: number = 5000) {
    this.sendMessageToUnity('DryFiController', 'FlyToLocation', `${lat},${lon},${height}`);
  }

  private sendMessageToUnity(objectName: string, methodName: string, payload: string) {
    if (this.isLoaded() && this.unityInstance) {
      try {
        this.unityInstance.SendMessage(objectName, methodName, payload);
      } catch (err) {
        console.warn(`[UnityService] Failed to send message to ${objectName}.${methodName}`, err);
      }
    }
  }
}
