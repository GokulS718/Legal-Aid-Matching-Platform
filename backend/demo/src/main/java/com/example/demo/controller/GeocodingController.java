package com.example.demo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

class GeocodingResponse {
    private String latitude;
    private String longitude;
    private String error;
    
    public GeocodingResponse() {}
    
    public GeocodingResponse(String latitude, String longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    public GeocodingResponse(String error) {
        this.error = error;
    }
    
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }
    
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}

/**
 * Geocoding Controller with multiple provider support
 * 
 * Tries providers in this order:
 * 1. LocationIQ (if LOCATIONIQ_API_KEY env var is set) - Free: 60 req/day
 * 2. OpenCage (if OPENCAGE_API_KEY env var is set) - Free: 2,500 req/day  
 * 3. Nominatim (always available, no API key needed) - Free but rate limited (1 req/sec)
 * 
 * To use LocationIQ or OpenCage:
 * - Get free API key from https://locationiq.com/free-tier or https://opencagedata.com/api
 * - Set environment variable: LOCATIONIQ_API_KEY or OPENCAGE_API_KEY
 * - Or add to application.properties: locationiq.api.key=your_key_here
 */
@RestController
@RequestMapping("/api/geocoding")

public class GeocodingController {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${geocoding.locationiq.key:}")
    private String locationiqKey;
    
    @Value("${geocoding.opencage.key:}")
    private String opencageKey;

    public GeocodingController() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        
        // Set timeout
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        restTemplate.setRequestFactory(factory);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Geocoding controller is working!");
    }

    @GetMapping("/geocode")
    public ResponseEntity<?> geocodeAddress(@RequestParam String address) {
        System.out.println("Geocoding address: " + address);
        
        // Try multiple geocoding providers in order of preference
        // Nominatim is always available (no API key needed)
        String[] providers = {"locationiq", "opencage", "nominatim"};
        
        for (String provider : providers) {
            try {
                GeocodingResponse result = geocodeWithProvider(address, provider);
                if (result != null && result.getError() == null && result.getLatitude() != null) {
                    System.out.println("Successfully geocoded using: " + provider);
                    return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(result);
                }
            } catch (Exception e) {
                System.out.println("Provider " + provider + " failed: " + e.getMessage());
                // Continue to next provider (Nominatim will always be tried as fallback)
            }
        }
        
        // All providers failed
        GeocodingResponse errorResponse = new GeocodingResponse(
            "Address not found. Please try a more specific address or enter coordinates manually."
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .contentType(MediaType.APPLICATION_JSON)
            .body(errorResponse);
    }
    
    private GeocodingResponse geocodeWithProvider(String address, String provider) throws Exception {
        String encodedAddress = java.net.URLEncoder.encode(address, java.nio.charset.StandardCharsets.UTF_8);
        String url = "";
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "LegalAid-Connect/1.0");
        
        switch (provider) {
            case "locationiq":
                // LocationIQ - Free tier: 60 requests/day
                // Get free API key from: https://locationiq.com/free-tier
                // Check environment variable first, then application.properties
                String locationiqApiKey = System.getenv("LOCATIONIQ_API_KEY");
                if (locationiqApiKey == null || locationiqApiKey.isEmpty()) {
                    locationiqApiKey = locationiqKey;
                }
                if (locationiqApiKey == null || locationiqApiKey.isEmpty()) {
                    throw new Exception("LocationIQ API key not configured. Skipping...");
                }
                url = "https://us1.locationiq.com/v1/search.php?key=" + locationiqApiKey 
                    + "&format=json&q=" + encodedAddress + "&limit=1&addressdetails=1&countrycodes=in";
                break;
                
            case "opencage":
                // OpenCage - Free tier: 2,500 requests/day
                // Get free API key from: https://opencagedata.com/api
                // Check environment variable first, then application.properties
                String opencageApiKey = System.getenv("OPENCAGE_API_KEY");
                if (opencageApiKey == null || opencageApiKey.isEmpty()) {
                    opencageApiKey = opencageKey;
                }
                if (opencageApiKey == null || opencageApiKey.isEmpty()) {
                    throw new Exception("OpenCage API key not configured. Skipping...");
                }
                url = "https://api.opencagedata.com/geocode/v1/json?q=" + encodedAddress 
                    + "&key=" + opencageApiKey + "&limit=1&countrycode=in";
                break;
                
            case "nominatim":
                // OpenStreetMap Nominatim - Free, but has strict rate limits (1 req/sec)
                url = "https://nominatim.openstreetmap.org/search?format=json&q=" 
                    + encodedAddress + "&limit=5&addressdetails=1&countrycodes=in";
                // Respect rate limit
                Thread.sleep(1000);
                break;
                
            default:
                throw new Exception("Unknown provider: " + provider);
        }
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
            url, 
            HttpMethod.GET, 
            entity, 
            String.class
        );
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            String responseBody = response.getBody();
            System.out.println(provider + " response: " + responseBody.substring(0, Math.min(200, responseBody.length())));
            
            JsonNode jsonArray = objectMapper.readTree(responseBody);
            
            if (jsonArray.isArray() && jsonArray.size() > 0) {
                JsonNode firstResult = jsonArray.get(0);
                
                // Different providers may use different field names
                String lat = null;
                String lon = null;
                
                if (firstResult.has("lat") && firstResult.has("lon")) {
                    lat = firstResult.get("lat").asText();
                    lon = firstResult.get("lon").asText();
                } else if (firstResult.has("latitude") && firstResult.has("longitude")) {
                    lat = firstResult.get("latitude").asText();
                    lon = firstResult.get("longitude").asText();
                } else if (firstResult.has("geometry") && firstResult.get("geometry").has("coordinates")) {
                    // Some APIs return coordinates as [lon, lat] array
                    JsonNode coords = firstResult.get("geometry").get("coordinates");
                    lon = coords.get(0).asText();
                    lat = coords.get(1).asText();
                }
                
                if (lat != null && lon != null) {
                    System.out.println("Found coordinates: " + lat + ", " + lon);
                    return new GeocodingResponse(lat, lon);
                }
            }
        }
        
        return new GeocodingResponse("No results found");
    }
}

