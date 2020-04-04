let people = [];
let friendships = [];
let targetPerson;
let iteration = 0;
const dashboard = document.getElementById("dashboard");
dashboard.style.left = (window.innerWidth - 460) + "px";

function setup() {
    createCanvas(window.innerWidth - 480, window.innerHeight - 20);
}

function friendshipStrength(ship) {
    const p1strength = ship.person1.friendPointsAlloc[ship.person1.friendsWith.findIndex(friend => friend === ship.person2)];
    const p2strength = ship.person2.friendPointsAlloc[ship.person2.friendsWith.findIndex(friend => friend === ship.person1)];
    return (p1strength + p2strength) / 2;
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

function bound1(x) {
    return min(1, max(0, x));
}

function draw() {
    background(255);
    rect(0, 0, width, height);
    friendships.forEach(ship => {
        const strength = friendshipStrength(ship);
        strokeWeight(strength * 2);
        const avgStrength = (ship.person1strength + ship.person2strength) / 2;
        stroke(255 - (255 * avgStrength), 255 * avgStrength, 0);
        line(ship.person1.x, ship.person1.y, ship.person2.x, ship.person2.y);
        stroke(0);
        strokeWeight(1);
    })
    people.forEach(person => {
        person.x += person.xVel * Math.cos(iteration / 100);
        person.y += person.yVel * Math.sin(iteration / 100);
        person.xVel += (Math.random() - 0.5) * 0.025;
        person.yVel += (Math.random() - 0.5) * 0.025;
        if (person === targetPerson && !targetPerson.dragged) {
            person.trails.push({ x: person.x, y: person.y, alpha: 1 });
        }
        let total = 0;
        friendships.filter(ship => ship.people.includes(person)).forEach(({ person1strength, person2strength }) => {
            const avg = (person1strength + person2strength) / 2;
            if (avg < 0.4) {
                total -= avg * 2;
            } else {
                total += avg;
            }
        })
        person.stats.features.happiness = sigmoid(total) * person.loneliness;
        /*person.trails.forEach((point) => {
            const { x, y, alpha } = point;
            stroke(0, 0, 0, alpha * 255);
            ellipse(x, y, 1, 1);
            stroke(0);
            point.alpha -= 0.0025;
        });*/
        person.trails.forEach((point, i) => {
            if (point.alpha <= 0) {
                person.trails.slice(i, 1);
            }
        });
        if (person === targetPerson) {
            stroke(125);
        }
        const wellness = (person.stats.features.happiness - person.stats.features.insecurity + 1) / 2;
        fill(255 - (255 * wellness), 255 * wellness, 0)
        ellipse(person.x, person.y, 75, 75);
        fill(255);
        stroke(0);
        textSize(15);
        textAlign(CENTER);
        text(person.name, person.x, person.y + 5);
    });
    if (iteration % 60 === 0) {
        friendships.forEach(ship => {
            const eventChance = min((ship.person1.stats.traits.extraversion + ship.person2.stats.traits.extraversion) / 2, 0.03);
            if (Math.random() < eventChance) {
                const weight = (ship.person1.stats.features.kindness + ship.person2.stats.features.kindness - ship.person1.stats.features.insecurity - ship.person2.stats.features.insecurity) / 2;
                if (Math.random() < weight) {
                    if (Math.random() < 0.75) {
                        ship.person1strength += random(0.03, 0.07);
                        ship.person1strength = bound1(ship.person1strength);
                        ship.person2strength += random(0.03, 0.07);
                        ship.person2strength = bound1(ship.person2strength);
                    } else {
                        ship.person1strength += random(0.07, 0.15);
                        ship.person1strength = bound1(ship.person1strength);
                        ship.person2strength += random(0.07, 0.15);
                        ship.person2strength = bound1(ship.person2strength);
                    }
                } else {
                    if (Math.random() < 0.75) {
                        ship.person1strength -= random(0.03, 0.07);
                        ship.person1strength = bound1(ship.person1strength);
                        ship.person2strength -= random(0.03, 0.07);
                        ship.person2strength = bound1(ship.person2strength);
                    } else {
                        ship.person1strength -= random(0.07, 0.15);
                        ship.person1strength = bound1(ship.person1strength);
                        ship.person2strength -= random(0.07, 0.15);
                        ship.person2strength = bound1(ship.person2strength);
                    }
                }
            }
        });
        people.forEach(person1 => {
            people.forEach(person2 => {
                if (person2 !== person1 && !person1.nos.includes(person2) && !person1.friendsWith.includes(person2) && person1.friendsWith.length < (4 + round(6 * person1.stats.features.socialEagerness)) && person2.friendsWith.length < (4 + round(6 * person2.stats.features.socialEagerness))) {
                    const distance = dist(person1.x, person1.y, person2.x, person2.y);
                    if (distance <= (200 + (200 * ((person1.stats.features.socialEagerness + person2.stats.features.socialEagerness + person1.stats.features.happiness + person2.stats.features.happiness) / 4)))) {
                        const mses = [];
                        Object.entries(person1.stats.traits).forEach(([trait, value]) => {
                            let otherValue = person2.stats.traits[trait];
                            if (person1.stats.ideals[trait] === 0) {
                                otherValue = (otherValue - 0.5) * -1 + 0.5;
                            }
                            mses.push(Math.abs(value - otherValue));
                        })
                        const mse = (mses.reduce((t, v) => t + v) / mses.length) * person1.stats.features.amicability * person2.stats.features.amicability * (person1.stats.features.gender !== person2.stats.features.gender ? person1.stats.features.genderDiscount : person2.stats.features.genderDiscount) * 0.5;
                        if (Math.random() < mse) {
                            friendships.push({
                                people: [person1, person2],
                                person1,
                                person2,
                                person1strength: abilityScore(),
                                person2strength: abilityScore()
                            });
                            person1.friendsWith.push(person2);
                            person2.friendsWith.push(person1);
                            person1.friendPointsAlloc.push(drawFriendPoints(person1));
                            person2.friendPointsAlloc.push(drawFriendPoints(person2));
                        }
                    }
                }
            })
        })
        people.forEach(person => {
            if (Math.random() < person.stats.traits.charisma) {
                const ships = [];
                person.friendsWith.forEach((friend, i) => {
                    const ship = {};
                    ship.index = i;
                    ship.friend = friend;
                    ship.attention = person.friendPointsAlloc[i];
                    const friendship = friendships.find(f => f.people.includes(person) && f.people.includes(friend));
                    ship.strength = (friendship.person1strength + friendship.person2strength) / 2;
                    ship.friendship = friendship;
                    ships.push(ship);
                });
                ships.sort((a, b) => b.strength - a.strength);
                let best;
                let currIndex;
                for (const [idx, ship] of Object.entries(ships)) {
                    if (ship.attention < 3) {
                        best = ship;
                        currIndex = idx + 1;
                        break;
                    }
                }
                if (best) {
                    let worst;
                    for (const ship of ships.slice(currIndex)) {
                        if (ship.attention > best.attention) {
                            worst = ship;
                        }
                    }
                    if (worst) {
                        person.friendPointsAlloc[best.index]++;
                        person.friendPointsAlloc[worst.index]--;
                    }
                }
                let remove = ships[ships.length - 1];
                if (remove) {
                    if (Math.random() < ((1 - remove.strength) / 4) && remove.attention === 1) {
                        friendships.splice(friendships.indexOf(remove.friendship), 1);
                        person.friendsWith.splice(remove.index, 1);
                        person.friendPointsAlloc.splice(remove.index, 1);
                        person.friendPoints++;
                        const otherIndex = remove.friend.friendsWith.findIndex(p => p === person);
                        remove.friend.friendsWith.splice(otherIndex, 1);
                        remove.friend.friendPointsAlloc.splice(otherIndex, 1);
                        remove.friend.friendPoints++;
                        person.nos.push(remove.friend);
                        remove.friend.nos.push(person);
                    }
                }
            }
        })
    }
    if (iteration % 240 === 0) {
        people.forEach(person => {
            if (person.friendsWith.length === 0) {
                person.loneliness *= 0.9;
                person.loneliness = max(0.5, person.loneliness);
            } else {
                person.loneliness = 1;
            }
        })
    }
    if (iteration % 1200 === 0) {
        people.forEach(person => {
            person.nos = [];
        })
    }
    iteration++;
}

function abilityScore(mean = 0.5, stdv = 0.25) {
    return min(1, max(0, randomGaussian(mean, stdv)));
}

function drawFriendPoints(person) {
    const friends = person.friendsWith.length;
    let ret;
    if (friends <= 2) {
        ret = 3;
    } else if (friends <= 4) {
        ret = 2;
    } else {
        ret = 1;
    }
    person.friendPoints -= ret;
    return ret;
}

function likenessScore() {
    if (random() < 0.8) {
        return 1;
    }
    return 0;
}

function updateDashboard() {
    let html = `<h1>${targetPerson.name}<h1>`
    html += "<h3>Traits:</h3>";
    html += "<ul>"
    Object.entries(targetPerson.stats.traits).forEach(([trait, value]) => {
        html += `<li>${trait}: <input id="trait${trait}" value="${value.toFixed(2)}" style="width:25px"><button id="ideal${trait}">${targetPerson.stats.ideals[trait] === 1 ? "+" : "-"}</button></li>`
    })
    html += "</ul>"
    html += "<h3>Features:</h3>"
    html += "<ul>"
    Object.entries(targetPerson.stats.features).forEach(([feature, value]) => {
        if (feature === "gender") {
            html += `<li>gender: ${value}</li>`
        } else {
            html += `<li>${feature}: <input id="feature${feature}" value="${value.toFixed(2)}" style="width:25px"></li>`;
        }
    });
    html += "</ul>";
    html += "<h3>Friends:</h3>"
    html += "<ul>";
    targetPerson.friendsWith.forEach((friend, i) => {
        const friendAlloc = targetPerson.friendPointsAlloc[i];
        const status = ["", "friend", "close friend", "best friend"][friendAlloc];
        html += `<li>${friend.name} - ${status}</li>`;
    });
    html += "</ul>"
    dashboard.innerHTML = html;
    Object.keys(targetPerson.stats.traits).forEach((trait) => {
        const input = document.getElementById(`trait${trait}`);
        input.oninput = () => {
            const number = Number(input.value);
            if (!Number.isNaN(number) && number >= 0 && number <= 1) {
                targetPerson.stats.traits[trait] = Number(input.value);
            }
        };
    });
    Object.keys(targetPerson.stats.features).forEach((feature) => {
        if (feature !== "gender") {
            const input = document.getElementById(`feature${feature}`);
            input.oninput = () => {
                const number = Number(input.value);
                if (!Number.isNaN(number) && number >= 0 && number <= 1) {
                    targetPerson.stats.features[feature] = Number(input.value);
                }
            };
        }
    });
    Object.keys(targetPerson.stats.ideals).forEach((ideal) => {
        const button = document.getElementById(`ideal${ideal}`);
        button.onclick = () => {
            if (button.innerHTML === "+") {
                button.innerHTML = "-";
                targetPerson.stats.ideals[ideal] = 0;
            } else {
                button.innerHTML = "+";
                targetPerson.stats.ideals[ideal] = 1;
            }
        };
    })
}

function mousePressed() {
    let found = false;
    people.forEach(person => {
        if (dist(person.x, person.y, mouseX, mouseY) < 75 / 2) {
            targetPerson = person;
            updateDashboard();
            found = true;
        }
    })
    if (!found && mouseX <= width && mouseY <= height) {
        if (targetPerson) {
            targetPerson.trails = [];
        }
        targetPerson = undefined;
        dashboard.innerHTML = "";
    }

}

function mouseDragged() {
    if (targetPerson && mouseX <= width && mouseY <= height) {
        targetPerson.x = mouseX;
        targetPerson.y = mouseY;
        targetPerson.dragged = true;
        targetPerson.trails = [];
    }
}

function mouseReleased() {
    if (targetPerson) {
        targetPerson.dragged = false;
    }
}

function randGender() {
    const roll = Math.random();
    if (roll < 0.485) {
        return "male";
    } else if (roll < 0.97) {
        return "female";
    } else {
        return "other";
    }
}

function newPerson(name, gender) {
    const person = {
        x: random(0, width),
        y: random(0, height),
        xVel: Math.random() * 2 - 1,
        yVel: Math.random() * 2 - 1,
        loneliness: 1,
        friendsWith: [],
        friendPointsAlloc: [],
        name,
        trails: [],
        nos: [],
        stats: {
            traits: {
                strength: abilityScore(),
                dexterity: abilityScore(),
                constitution: abilityScore(),
                intelligence: abilityScore(),
                wisdom: abilityScore(),
                charisma: abilityScore(),
                extraversion: abilityScore(),
                sensing: abilityScore(),
                thinking: abilityScore(),
                judging: abilityScore()
            },
            ideals: {
                strength: likenessScore(),
                dexterity: likenessScore(),
                constitution: likenessScore(),
                intelligence: likenessScore(),
                wisdom: likenessScore(),
                charisma: likenessScore(),
                extraversion: likenessScore(),
                sensing: likenessScore(),
                thinking: likenessScore(),
                judging: likenessScore()
            },
            features: {
                amicability: abilityScore(),
                loyalty: abilityScore(),
                insecurity: abilityScore(0.2, 0.05),
                kindness: abilityScore(),
                genderDiscount: max(0.2, abilityScore()),
                gender,
                socialEagerness: abilityScore(),
                happiness: 0.5
            }
        }
    }
    person.friendPoints = 10 + round(6 * person.stats.features.socialEagerness);
    person.maxFriendPoints = person.friendPoints;
    return person;
}
async function keyPressed() {
    if (key === "a" || key === "A") {
        const { value: name } = await Swal.fire({
            title: "Enter a name for your person:",
            input: "text",
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter a name!'
                }
            }
        });
        if (name) {
            let { value: gender } = await Swal.fire({
                title: `Choose a gender for ${name}:`,
                input: "radio",
                showCancelButton: true,
                inputOptions: ["male", "female", "other"],
                inputValidator: (value) => {
                    if (!value) {
                        return 'You need to enter a name!'
                    }
                }
            })
            if (gender) {
                gender = ["male", "female", "other"][gender];
                people.push(newPerson(name, gender));
            }
        }
    }
}

document.getElementById("newPerson").onclick = () => {
    people.push(newPerson(faker.name.firstName(), randGender()))
}