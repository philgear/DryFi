using UnityEngine;
using System.Runtime.InteropServices;
// Requires CesiumForUnity
using CesiumForUnity;
using Unity.Mathematics;

public class DryFiController : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void NotifyUnityLoaded();

    [DllImport("__Internal")]
    private static extern void NotifyPoiClicked(string poiId);

    [Header("Cesium Components")]
    public CesiumGeoreference georeference;
    public CesiumFlyToController flyToController;

    void Start()
    {
        // Tell Angular we are ready
        #if UNITY_WEBGL && !UNITY_EDITOR
        NotifyUnityLoaded();
        #endif
    }

    // Called from Angular: UnityService.flyTo(lat, lon, height)
    // Payload format: "latitude,longitude,height"
    public void FlyToLocation(string payload)
    {
        string[] parts = payload.Split(',');
        if (parts.Length == 3)
        {
            if (double.TryParse(parts[0], out double lat) &&
                double.TryParse(parts[1], out double lon) &&
                double.TryParse(parts[2], out double height))
            {
                if (flyToController != null)
                {
                    // Assuming rotation pitch is -45 degrees for a nice isometric/angled view
                    flyToController.FlyToLocationEarth(new double3(lon, lat, height), 0, -45);
                }
                else
                {
                    Debug.LogWarning("CesiumFlyToController reference is missing!");
                }
            }
        }
    }

    // Example trigger for when a user clicks a 3D collider in Unity
    public void OnPoiInteract(string localId)
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        NotifyPoiClicked(localId);
        #else
        Debug.Log("POI Clicked: " + localId);
        #endif
    }
}
