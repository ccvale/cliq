from pydantic import BaseModel

'''
This is where the scoring algorithm was being tested.
The logic here is that we want to match users based on their age, interests, job title, job company, and town.
I wanted a quick way to test the algorithm, so I created a class to represent a user, and then created a few users to test the algorithm with.
The goal here was that I wanted to play with the numbers until I found a good balance of scoring that would give me the best matches.
The scoring algorithm is based on a 0+ scoring system, where the higher the score, the better the match, and is detailed in the comments below,
and especially in the `scoring.ts` file, where it is used in the actual application.
'''
class User(BaseModel):
    age: int
    interest1: str
    interest2: str
    interest3: str
    job_title: str
    job_company: str
    town: str


me = User(age=23, interest1='sports', interest2='music', interest3='food', town='Waldwick', job_title='Software Engineer', job_company='Google')

# similar age, same company, same town, 2 interests in common, different job title
user1 = User(age=20, interest1='art', interest2='music', interest3='food', town='Waldwick', job_title='Data Analyst', job_company='Google')

# same age, two matching interests, different town, same job title, different company
user2 = User(age=23, interest1='sports', interest2='video games', interest3='food', town='Allendale', job_title='Software Engineer', job_company='Meta')

# different age, different town/job title/job company, 1 matching interest
user3 = User(age=26, interest1='sports', interest2='music', interest3='food', town='Stockholm', job_title='Janitor', job_company='Ikea')

# vastly different age, different town, same job title/job company, no matching interests
user4 = User(age=34, interest1='art', interest2='fishing', interest3='ballet', town='Oklahoma City', job_title='Software Engineer', job_company='Google')

# same age, two matching interests, different town, different job title/job company
user5 = User(age=23, interest1='music', interest2='sports', interest3='ballet', town='Wayne', job_title='Assistant', job_company='Gym')

# same age, different town, same job title/job company, no matching interests
user6 = User(age=23, interest1='art', interest2='fishing', interest3='ballet', town='Oklahoma City', job_title='Software Engineer', job_company='Google')

users = [user1, user2, user3, user4, user5, user6]

# bonus adjustment multipliers for:
# complete match on interest (yes)
# complete match on job (pos, location) - (yes)
# (negative adjustment) for age difference > 10 years (yes)
# (positive adjustment) for distance (yes),


def algo(me, other):
    score = 0 # using a 0+ based scoring system; doesn't really matter how this is done, but more score = better match in this case

    # age
    if me.age == other.age:
        score += 10
    elif abs(me.age - other.age) <= 3:
        score += 5 # quick win
    elif abs(me.age - other.age) > 5:
        score -= abs(me.age - other.age)
    
    # interest similarity - looking for the intersection of the two sets
    myInterests = set([me.interest1, me.interest2, me.interest3])
    theirInterests = set([other.interest1, other.interest2, other.interest3])
    interests = myInterests.intersection(theirInterests)

    # want score to be as follows: 10 points for one interest in common, 30 for two in common, 50 for all three
    if len(interests) == 3:
        score += 50
    elif len(interests) == 2:
        score += 30
    elif len(interests) == 1:
        score += 10



    # distance (it would be slower to convert distances, so we will match towns instead)
    if me.town == other.town:
        score += 5 # quick win

    # job similarity
    if me.job_title == other.job_title and me.job_company == other.job_company:
        score += 20 # 10 point bonus for complete match - we can assume that we are coworkers on the same team, or classmates in the same school
    elif me.job_title == other.job_title:
        score += 5
    elif me.job_company == other.job_company:
        score += 5

    return score

for user in users:
    print(algo(me, user))