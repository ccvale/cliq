import axios from 'axios';

export default async function geocoding(location: string): Promise<[number, number]> {
    
    /*
        NAME

        geocoding - gets the latitude and longitude of a location

        SYNOPSIS

        geocoding(location)
            - location: string - the given location from a user in which we want to get the latitude and longitude of

        DESCRIPTION
        
            This function will calculate the age of the user, by using the Google Maps Geocoding API to get the latitude and longitude of a location,
            and then return the latitude and longitude of the location. We take this information and use it to calculate the distance between two users 
            in the matching algorithm.
    */
    
    const api_url = 'https://maps.googleapis.com/maps/api/geocode/' //replaced opencage with google maps (great choice, way better)
    const request_url = `${api_url}json?address=${encodeURIComponent(location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;


    try {
        const response = await axios.get(request_url);
        const data = response.data;
        const lat = data.results[0].geometry.location.lat;
        const lng = data.results[0].geometry.location.lng;

        if (typeof lat === 'number' && typeof lng === 'number') {
            return [lat, lng];
        } else {
            throw new Error('Invalid latitude or longitude');
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to retrieve latitude and longitude');
    }
}