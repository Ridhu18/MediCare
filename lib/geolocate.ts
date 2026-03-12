export interface GeolocationResult {
    lat: number
    lng: number
    error?: {
        code: number
        message: string
    }
}

export const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 } // Bangalore

export async function getCurrentLocation(options?: PositionOptions): Promise<GeolocationResult> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({
                ...DEFAULT_LOCATION,
                error: { code: 0, message: "Geolocation not supported" },
            })
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
            },
            (error) => {
                let message = "Unknown error"
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "User denied the request for Geolocation."
                        break
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable."
                        break
                    case error.TIMEOUT:
                        message = "The request to get user location timed out."
                        break
                }
                resolve({
                    ...DEFAULT_LOCATION,
                    error: { code: error.code, message },
                })
            },
            { timeout: 10000, enableHighAccuracy: false, ...options }
        )
    })
}
