export default async function updateUser(url: any, data: any) {

    // we need the id to update the user, but we don't want to send it to the server as part of the payload
    const id = data['arg']['id'];

    if (id) {
        delete data['arg']['id'];
    }

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