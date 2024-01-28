from pydantic import BaseModel

class User(BaseModel):
    age: int
    interest1: str
    interest2: str
    interest3: str
    distance_away: int


me = User(age=23, interest1="sports", interest2="music", interest3="food", distance_away=0)
user1 = User(age=20, interest1="sports", interest2="music", interest3="food", distance_away=10)


def algo():
    score = 0
    if me.age == user1.age:
        score += 1
    if me.interest1 == user1.interest1:
        score += 1
    if me.interest2 == user1.interest2:
        score += 1
    if me.interest3 == user1.interest3:
        score += 1
    if me.distance_away == user1.distance_away:
        score += 1
    return score

print(algo())
