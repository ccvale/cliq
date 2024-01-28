import axios from 'axios';

export default async function geocoding(location: string): Promise<[number, number]> {
    /*
        NAME

        geocoding - gets the latitude and longitude of a location

        SYNOPSIS

        geocoding(location)
            - location: string - the given location from a user in which we want to get the latitude and longitude of

        DESCRIPTION

            This function will calculate the age of the user.
            It will return the age of the user.
    */
    
    const api_url = 'https://api.opencagedata.com/geocode/v1/json';
    const request_url = `${api_url}?key=${process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY}&q=${encodeURIComponent(location)}&pretty=1&no_annotations=1`;

    try {
        const response = await axios.get(request_url);
        const data = response.data;
        const lat = data.results[0].bounds.northeast.lat;
        const lng = data.results[0].bounds.northeast.lng;

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