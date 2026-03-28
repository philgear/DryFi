import { Component, ElementRef, OnInit, OnDestroy, ViewChild, effect, input, output } from '@angular/core';
import { Deck, _GlobeView as GlobeView, FlyToInterpolator } from '@deck.gl/core';
import { TileLayer, Tile3DLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { Tiles3DLoader } from '@loaders.gl/3d-tiles';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-globe',
  standalone: true,
  template: `
    <div #deckContainer class="w-full h-full absolute inset-0 z-0 bg-slate-950"></div>
    <ng-content></ng-content>
  `,
  styles: []
})
export class GlobeComponent implements OnInit, OnDestroy {
  @ViewChild('deckContainer', { static: true }) deckContainer!: ElementRef;
  
  // @ts-ignore
  private deck!: Deck<any>;

  // React to target location changes (lat, lon)
  targetLocation = input<{lat: number, lon: number} | null>();

  // Emit coordinate when globe is clicked
  locationSelected = output<{lat: number, lon: number}>();

  constructor() {
    effect(() => {
      const loc = this.targetLocation();
      if (loc && this.deck) {
        this.deck.setProps({
          initialViewState: {
            longitude: loc.lon,
            latitude: loc.lat,
            zoom: 3.5,
            transitionDuration: 2500,
            transitionInterpolator: new FlyToInterpolator()
          }
        });
      }
    });
  }

  ngOnInit() {
    const GOOGLE_API_KEY = environment.GOOGLE_MAPS_API_KEY;
    const TILESET_URL = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_API_KEY}`;

    // @ts-ignore
    const tile3dLayer = new Tile3DLayer({
      id: 'google-3d-tiles',
      data: TILESET_URL,
      loader: Tiles3DLoader,
      loadOptions: {
        fetch: async (url: string | Request, options?: RequestInit) => {
          const res = await fetch(url, options);
          const reqUrl = typeof url === 'string' ? url : url.url;
          
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (reqUrl.includes('.json') || contentType.includes('application/json')) {
              const clone = res.clone();
              try {
                const data = await clone.json();
                if (data && data.asset && typeof data.asset.copyright === 'string') {
                  data.asset.copyright = [data.asset.copyright];
                  return new Response(JSON.stringify(data), {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
          return res;
        },
        '3d-tiles': {}
      },
      onTileError: (error: any) => console.error('Error loading Google 3D Tile:', error),
      maximumScreenSpaceError: 4 // Lower value = much higher texture and mesh quality
    });

    // @ts-ignore
    const backgroundEarthLayer = new TileLayer({
      id: 'earth-satellite-base',
      data: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props: any) => {
        const { boundingBox } = props.tile;

        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [
            boundingBox[0][0], // west
            boundingBox[0][1], // south
            boundingBox[1][0], // east
            boundingBox[1][1]  // north
          ]
        });
      }
    });

    this.deck = new Deck({
      parent: this.deckContainer.nativeElement,
      views: new GlobeView(),
      initialViewState: {
        longitude: environment.SITE_LON,
        latitude: environment.SITE_LAT,
        zoom: 0.5
      },
      controller: { doubleClickZoom: false } as any,
      layers: [backgroundEarthLayer, tile3dLayer],
      // Strip 'around' from view state — GlobeView doesn't support zoom-to-point
      onViewStateChange: ({ viewState }: any) => {
        const { around: _dropped, ...safeState } = viewState;
        this.deck.setProps({ initialViewState: safeState });
      },
      onClick: (info: any) => {
        if (info && info.coordinate) {
          // Deck.gl coordinates are [longitude, latitude]
          this.locationSelected.emit({
            lat: info.coordinate[1],
            lon: info.coordinate[0]
          });
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.deck) {
      this.deck.finalize();
    }
  }
}
