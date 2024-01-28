from pydantic import BaseModel

# just using this as a place to test and tweak the scoring algorithm
class User(BaseModel):
    age: int
    interest1: str
    interest2: str
    interest3: str
    job_title: str
    job_company: str
    town: str


me = User(age=23, interest1='sports', interest2='music', interest3='food', town='Waldwick', job_title='Software Engineer', job_company='Google')

user1 = User(age=20, interest1='art', interest2='music', interest3='food', town='Waldwick', job_title='Data Analyst', job_company='Google')
user2 = User(age=23, interest1='sports', interest2='video games', interest3='food', town='Allendale', job_title='Software Engineer', job_company='Meta')
user3 = User(age=26, interest1='sports', interest2='music', interest3='food', town='Stockholm', job_title='Janitor', job_company='Ikea')
user4 = User(age=34, interest1='art', interest2='fishing', interest3='ballet', town='Oklahoma City', job_title='Software Engineer', job_company='Google')

# bonus adjustment multipliers for:
# complete match on interest
# complete match on job (pos, location)
# (negative adjustment) for age difference > 10 years


def algo(me, other):
    score = 0

    # age
    if me.age == other.age:
        score += 5
    else:
        score -= abs(me.age - other.age) if abs(me.age - other.age) < 10 else abs(me.age - other.age) * 2
    
    # interest similarity
    interests = set([me.interest1, me.interest2, me.interest3, other.interest1, other.interest2, other.interest3])
    score += len(interests) * 10 if len(interests) < 3 else 50 # bonus

    # distance (it would be slower to convert distances, so we will match towns instead)
    if me.town == other.town:
        score += 5

    # job similarity
    if me.job_title == other.job_title and me.job_company == other.job_company:
        score += 20
    elif me.job_title == other.job_title:
        score += 5
    elif me.job_company == other.job_company:
        score += 5

    return score

print(algo(me, user1))
print(algo(me, user2))
print(algo(me, user3))
print(algo(me, user4))
