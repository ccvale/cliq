import haversine from 'haversine-distance';
import geocoding from '@/lib/geocoding';

export default async function calculateDistanceBetweenTowns(town1: string, town2: string): Promise<number> {
    /*
        NAME

            calculateDistanceBetweenTowns - calculates the distance between two towns

        SYNOPSIS

            calculateDistanceBetweenTowns(town1, town2)
                - town1: string - the first town
                - town2: string - the second town

        DESCRIPTION

            This function will calculate the distance between two towns.
            It will return the distance between the two towns, in miles.
            This function will return -999 if the distance cannot be calculated.
            This function is using a `geocoding` API call to get the coordinates of the towns, and then using the `haversine` library to calculate the distance.
    */

    const town1Coordinates = await geocoding(town1);
    const town2Coordinates = await geocoding(town2);
    if (!town1Coordinates || !town2Coordinates) {
        return -999;
    }

    const distance = haversine({ lat: town1Coordinates[0], lng: town1Coordinates[1] }, { lat: town2Coordinates[0], lng: town2Coordinates[1] });
    return Math.round(distance * 0.000621371); // convert to miles and round
}