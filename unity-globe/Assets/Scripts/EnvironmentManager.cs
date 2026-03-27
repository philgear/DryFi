using UnityEngine;

public class EnvironmentManager : MonoBehaviour
{
    [Header("Lighting")]
    public Light sunLight;

    // Called from Angular: payload is "elevationDeg"
    public void UpdateSunPosition(string payload)
    {
        if (float.TryParse(payload, out float elevation))
        {
            if (sunLight != null)
            {
                // Simple directional light mapping: elevation 90 is directly overhead
                // elevation 0 is horizon
                sunLight.transform.rotation = Quaternion.Euler(elevation, 0, 0);
                
                // Adjust intensity based on elevation (dimmer near horizon, off below horizon)
                float normalizedElevation = Mathf.Clamp01(elevation / 90f);
                if (elevation < 0)
                {
                    sunLight.intensity = 0f;
                }
                else
                {
                    sunLight.intensity = Mathf.Lerp(0.1f, 1.2f, normalizedElevation);
                }
            }
        }
    }

    // Called from Angular: payload is "cloudCoverPercent,precipChancePercent"
    public void UpdateWeather(string payload)
    {
        // Here you would hook up Unity Particle Systems to match the 
        // thermodynamic origami effects from the original CSS payload
        Debug.Log("Weather updated from Angular: " + payload);
    }
}
