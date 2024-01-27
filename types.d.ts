// This is where a majority of the remaining logic for the generated test data calculations are stored...these are no longer used

export const paletteOptions: string[] = ['Slate', 'Orange', 'Gray', 'Yellow', 'Zinc', 'Green', 'Neutral', 'Blue', 'Stone', 'Indigo', 'Red', 'Purple', 'Pink', 'Amber', 'Cyan', 'Violet', 'Lime', 'Rose', 'Teal'];

export type User = {
    name: string,
    age: number,
    position?: string,
    positionAt?: string,
    bio?: string,
    location?: string,
    interests?: string[],
    palette: string[],
}

export const interestOptions: string[] = [
    'Basketball', 'Football', 'Soccer', 'Baseball', 'Hockey',
    'Golf', 'Tennis', 'Volleyball', 'Running', 'Swimming',
    'Cycling', 'Hiking', 'Skiing', 'Snowboarding', 'Skateboarding',
    'Surfing', 'Yoga', 'Pilates', 'Weightlifting', 'Crossfit',
    'Parkour', 'Martial Arts', 'Dancing', 'Cooking', 'Baking',
    'Gardening', 'Painting', 'Drawing', 'Sculpting', 'Photography',
    'Singing', 'Playing an Instrument', 'Writing', 'Reading',
    'Watching Movies', 'Watching TV', 'Video Games', 'Board Games',
    'Card Games', 'Puzzles', 'Traveling', 'Camping', 'Fishing',
    'Hunting', 'Boating', 'Kayaking', 'Canoeing', 'Rock Climbing',
    'Sky Diving', 'Bungee Jumping', 'Parachuting', 'Scuba Diving',
    'Snorkeling', 'Sailing', 'Horseback Riding',
    'Archery', 'Badminton', 'Table Tennis', 'Bowling', 'Chess',
    'Creative Writing', 'Digital Art', 'DIY Projects', 'Drama/Theatre',
    'Fashion Design', 'Film Making', 'Flower Arranging', 'Geocaching',
    'Graphic Design', 'Homebrewing', 'Interior Design', 'Jewelry Making',
    'Knitting', 'Magic and Illusion', 'Meditation', 'Model Building',
    'Pottery', 'Quilting', 'Radio-Controlled Models', 'Rap Music',
    'Scrapbooking', 'Sewing', 'Stand-Up Comedy', 'Tai Chi',
    'Tarot Reading', 'Urban Exploration', 'Video Editing', 'Wine Tasting',
    'Woodworking', 'Zumba', 'Aquarium Keeping', 'Bird Watching',
    'Blogging', 'Calligraphy', 'Candle Making', 'Ceramics',
    'Comic Book Collecting', 'Cosplay', 'Dungeons & Dragons',
    'Embroidery', 'Fossil Hunting', 'Genealogy', 'Glassblowing',
    'Herbalism', 'Lapidary', 'Leatherworking', 'Lego Building',
    'Macrame', 'Metalworking', 'Origami', 'Paintball',
    'Stamp Collecting', 'Podcasting', 'Poi',
    'Robotics', 'Role-Playing Games', 'Soap Making', 'Speed Cubing',
    'Spoken Word', 'Taxidermy', 'Tea Tasting', 'Urban Gardening',
    'Virtual Reality Gaming', 'Volunteering', 'Whittling'
];
