import { User } from "../../types";


const names = ['John', 'Alice', 'Bob', 'Eva', 'Michael', 'Sarah', 'David', 'Anna', 'Peter', 'Samantha'];

const ages = [24, 28, 22, 30, 25, 27, 26, 29, 23, 31];

const positions = ['Software Engineer', 'Web Developer', 'Data Scientist', 'UX Designer', 'Product Manager',];

const companies = ['Google', 'Microsoft', 'Facebook', 'Amazon', 'Tesla', 'Apple', 'Uber', 'Airbnb', 'Lyft', 'Netflix'];

const bios = [
  'I like to code and stuff',
  'Passionate about technology',
  'Data geek',
  'Design enthusiast',
  'Building the future with innovation',
  'I like to travel and meet new people',
  'I like to play basketball and watch movies',
  'I like to cook and eat',
  'I like to read and write',
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Life is what happens when you're busy making other plans. - John Lennon",
  "Get busy living, or get busy dying. - Stephen King",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
  "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
];

const locations = ['San Francisco, CA', 'New York, NY', 'Järbo, SE', 'Sandviken, SE', 'Freehold, NJ', 'Waldwick, NJ', 'White Plains, NY', 'Mahwah, NJ', 'Wayne, NJ', 'Portland, ME', 'Dallas, TX', 'Long Island, NY'];

const interestsList = [
  ['Basketball', 'Football', 'Music'],
  ['Reading', 'Traveling', 'Gaming'],
  ['Coding', 'Photography', 'Movies'],
  ['Cooking', 'Art', 'Fitness'],
  ['Science', 'Nature', 'Sustainability'],
  ['Footy', 'Cricket', 'Writing'],
  ['Politics', 'History', 'Philosophy'],
];

const paletteList = [
  ['slate', 'orange'],
  ['gray', 'yellow'],
  ['zinc', 'green'],
  ['neutral', 'blue'],
  ['stone', 'indigo'],
  ['red', 'purple'],
  ['orange', 'pink'],
  ['amber', 'cyan'],
  ['yellow', 'violet'],
  ['lime', 'rose'],
  ['green', 'teal']
];

  const paletteOptions = ['slate', 'orange', 'gray', 'yellow', 'zinc', 'green', 'neutral', 'blue', 'stone', 'indigo', 'red', 'purple', 'pink', 'amber', 'cyan', 'violet', 'lime', 'rose', 'teal']

  const getRandomValue = (array: Array<any>) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  };

  export const generateRandomUser = (): User => {
    const randomName = getRandomValue(names);
    const randomAge = getRandomValue(ages);
    const randomPosition = getRandomValue(positions);
    const randomCompany = getRandomValue(companies);
    const randomBio = getRandomValue(bios);
    const randomLocation = getRandomValue(locations);
    const randomInterests = getRandomValue(interestsList);
    const randomPalette = getRandomValue(paletteList);

    return {
      name: randomName,
      age: randomAge,
      position: randomPosition,
      positionAt: randomCompany,
      bio: randomBio,
      location: randomLocation,
      interests: randomInterests,
      palette: randomPalette,
    }

  }