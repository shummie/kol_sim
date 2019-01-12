var Encounter_Type = {
    COMBAT: 0,
    NON_COMBAT: 1,
    SUPERLIKELY: 2,
};


var condition_delay = {
    delay : 0,
    evaulate : function(zone, player) {
        if (zone.turn_count < delay) {
            return false;
        }
        return true;
    }
}

var condition_none = {
    evaulate : function(zone, player) { return true; }
}


class Item {
	constructor(name, droprate, droptype, keyword) {
		this.name = name;
		this.droprate = droprate;
		this.droptype = droptype;	// 0: normal, 1: pponly, 2: conditional
		this.keyword = keyword;
	}

	check_condition() {
		return true;
	}

	roll_for_drop(bonus_drop_rate) {
		if (this.droptype != 2) {
			return xrand.next_uniform() < (this.droprate * (1 + bonus_drop_rate));
		} else {
			if (this.check_condition()) {
				return xrand.next_uniform() < (this.droprate * (1 + bonus_drop_rate));
			} else {
				return false;
			}
		}
	}
}


var no_condition = function() { return true; }

var one_turn = function() { return 1; }

class Noncombat {

	constructor(name) {

		this.name = name;
		this.type = 1; // 0 for Combat, 1 for NC, 2 for superlikely.
		this.condition = no_condition;
		this.turns_taken = one_turn;

	}

}

class Superlikely {
	constructor(name, chance, ncmod = false) {
		this.name = name;
		this.type = 2; // 0 for Combat, 1 for NC, 2 for superlikely.
		this.noticesnc = ncmod;
		this.chance = chance;
		this.condition = no_condition;
		this.turns_taken = one_turn;
	}

	function roll_for_superlikely(player) {

		if (this.noticesnc) {
			return xrand.next_uniform() < (this.chance - player.combat_mod);
		} else {
			return xrand.next_uniform() < this.chance;
		}
	}
}

class Combat {
	constructor(name, mlevel) {
		this.name = name;
		this.level = mlevel;
		this.base_meat = 0;
		this.original_items = [];
		this.condition = no_condition;
	}
}



class Player {
	// Contains all the player stats to modify a zone for simulation purposes.

	constructor() {
		this.item_find = 0;
		this.monster_level = 0;
		this.combat_mod = 0;
		this.meat_drop = 0;
		this.init = 0;
	}
}

class Zone {

	constructor(name, combat_rate) {
		this.name = name;
		this.combat_rate = combat_rate;
        this.c_list = [];
        this.nc_list = [];
        this.sl_list = [];

        this.cq = [];
        this.ncq = [];

		this.turn_count = 0;
		this.quest_marker = 0;
	}

	reset() {
		this.turn_count = 0;
		this.quest_marker = 0;

        this.cq = [];
        this.ncq = [];
	}

    add_encounters(e_list) {
        let eid = 0;
        for (let e of e_list) {
            e.id = eid;
            if (e.type == Encounter_Type.COMBAT) {
                c_list.push(e);
            } else if (e.type == Encounter_Type.NON_COMBAT) {
                nc_list.push(e);
            } else {
                sl_list.push(e);
            }
            eid++;
        }
    }

    // https://cdn.discordapp.com/attachments/466966826165731328/475465031161479168/Encounter_Hierarchy_.png
	pick_adventure(player) {

        // Ignores hard-coded adventures, wandering adventures, clover adventures, and semi-rare adventures.
        let possible_encounters = [];
        let selected_encounter;
        // 1. Superlikely available?
        if (this.sl_list.length > 0) {
            // 1-1. Check conditions

            for (let e of sl_list) {
                if (e.condition.evaluate(this, player)) {
                    possible_encounters.push(e);
                }
            }

            // 1-2. Conditions satisfied? Randomly select with equal chance all SLs w/ conditions satisfied.
            if (possible_encounters.length > 0) {
                selected_encounter = possible_encounters[Math.floor(xrand.next_uniform() * possible_encounters.length)];
                selected_encounter.do(this, player);
                return selected_encounter;
            }
        }

        // 2. Non-combat / combat selection
        if (xrand.next_uniform() >= this.combat_rate + player.combat_mod) {
            // non-combat selected

            // 2-NC-1: Build NC list
            for (let e of nc_list) {
                if (e.condition.evaluate(this, player)) {
                    possible_encounters.push(e);
                }
            }

            // 2-NC-2: Roll for NC
            if (possible_encounters.length > 0) {
                while(true) {
                    selected_encounter = possible_encounters[Math.floor(xrand.next_uniform() * possible_encounters.length)];

                    // 2-NC-3: Check in queue?
                    let in_queue = false;
                    for (let q of ncq) {
                        if (q.id == selected_encounter.id) {
                            in_queue = true;
                            break;
                        }
                    }

                    // 2-NC-3-1: Roll for rejection
                    if (in_queue) {
                        if (xrand.next_uniform() <= 0.25) {
                            // accepted
                            in_queue = false;
                        }
                    }

                    if (!in_queue) {
                        // accepted or not in queue.
                        // add to queue.
                        ncq.push(selected_encounter.id);
                        ncq.shift();
                        selected_encounter.do(this, player);
                        return selected_encounter;
                    }

                    // else, if we're here, the noncombat got rejected, reroll (75% chance)
                }
            }
        }

        // 2-C-1: Build Combat list - Either we rolled a combat OR there are no eligible non-combats
        for (let e of c_list) {
            if (e.condition.evaluate(this, player)) {
                possible_encounters.push(e);
            }
        }

        // going to ignore possibility of no combats available (due to banishes for example)
        // 2-C-2: Roll for C
        while(true) {
            selected_encounter = possible_encounters[Math.floor(xrand.next_uniform() * possible_encounters.length)];

            // Olfacted?
            // If olfacted, then we're good.

            // if () {
            // cq.push(selected_encounter.id);
            // cq.shift();
            // selected_encounter.do(this, player);
            // return selected_encounter;
            // }

            // 2-NC-3: Check in queue?
            let in_queue = false;
            for (let q of cq) {
                if (q.id == selected_encounter.id) {
                    in_queue = true;
                    break;
                }
            }

            // 2-C-3-1: Roll for rejection
            if (in_queue) {
                if (xrand.next_uniform() <= 0.25) {
                    // accepted
                    in_queue = false;
                }
            }

            if (!in_queue) {
                // accepted or not in queue.
                // add to queue.
                cq.push(selected_encounter.id);
                cq.shift();
                selected_encounter.do(this, player);
                return selected_encounter;
            }
            // else, if we're here, the combat got rejected, reroll (75% chance)
        }
	}
}


class Encounter {

	constructor(name, etype) {
		this.type = etype;
		this.name = name;
        this.id = 0;
		this.meat_drop = 0;
		this.level = 0;
		this.defense = 0;
		this.hp = 0;
		this.init = 0;
		this.elemental = "";
		this.items = [];

		this.turns_taken = one_turn;
		this.condition = condition_none;
		this.noticesnc = notices_nc;

	}

    drop_items(player) {

        // go through and drop items based on item find.

    }


    do(zone, player) {
        zone.turns_taken += 1;
        // by default drop items. add this code in later...?
        this.drop_items(player);
    }

}
