export default async function updateUser(url: string, data: any) {

    const id = data['arg']['id'];
    delete data['arg']['id'];

    const options = {
        method: 'PATCH',
        headers: { Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81', 'Content-Type': 'application/json' },
        body: JSON.stringify(data['arg']) // Convert the payload to a JSON string
    };

    fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/Users/data/${id}?columns=id`, options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}