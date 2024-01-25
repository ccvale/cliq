export default async function getMatches(id: string) {
    const options = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81',
            'Content-Type': 'application/json'
        },
    };

    try {
        const response = await fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/Users/data/${id}`, options);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonResponse = await response.json();
        return jsonResponse;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
