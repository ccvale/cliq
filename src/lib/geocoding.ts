import axios from 'axios';

export default function geocoding(location: string): Promise<[number, number]> {
    const api_url = 'https://api.opencagedata.com/geocode/v1/json';

    const request_url =
        api_url +
        '?' +
        'key=' + process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY +
        '&q=' + encodeURIComponent(location) +
        '&pretty=1' +
        '&no_annotations=1';

    return axios.get(request_url)
        .then(response => {
            const data = response.data;
            const lat = data.results[0].bounds.northeast['lat'];
            const lng = data.results[0].bounds.northeast['lng'];
            if (typeof lat === 'number' && typeof lng === 'number') {
                return [lat, lng];
            } else {
                return Promise.reject(new Error('Invalid latitude or longitude'));
            }
        })
        .catch(error => {
            console.error(error);
            return Promise.reject(new Error('Failed to retrieve latitude and longitude'));
        }) as Promise<[number, number]>;
}
