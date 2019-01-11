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
		this.combat_rate = 1 - combat_rate;
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

	}

    add_encounters(e_list) {
        for (let e of e_list) {
            if (e.type == Encounter_Type.COMBAT) {
                c_list.push(e);
            } else if (e.type == Encounter_Type.NON_COMBAT) {
                nc_list.push(e);
            } else {
                sl_list.push(e);
            }

        }
    }


	pick_adventure(player) {



	}

}


class Encounter {

	constructor(name, etype) {
		this.type = etype;
		this.name = name;
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

        this.do = function(zone, player) {
            zone.turns_taken += 1;

            // by default drop items. add this code in later...?
            this.drop_items(player);
        }
	}

    drop_items(player) {

        // go through and drop items based on item find.

    }

}
