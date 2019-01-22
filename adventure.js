var Encounter_Type = {
    COMBAT: 0,
    NON_COMBAT: 1,
    SUPERLIKELY: 2,
};

var Drop_Type = {
	NORMAL: 0,
	PPONLY: 1,
	CONDITIONAL: 2,
}


// Uses BITSHIFTS to determine PP Types available.
// To add a PP Type: player.pp |= PP_Type.XO_SKELETON
// To check for a PP Type: ((player.pp & PP_Type.XO_SKELETON) >> PP_Type.XO_SKELETON) == 1;

var PP_Type = {
	NONE: 0,
	NORMAL: 1,
	XO_SKELETON: 2,
	TEST: 4,
}

var PP_Shift = {
	NORMAL: 0,
	XO_SKELETON: 1,
	TEST: 2,
}

var condition_delay = {
    delay : 0,
    evaluate : function(zone, player) {
        if (zone.turn_count < this.delay) {
            return false;
        }
        return true;
    }
}

var condition_none = {
    evaluate : function(zone, player) { return true; }
}

var item_condition_none = {
    evaluate : function(player) { return true; }
}

class Item {
	constructor(name, droprate, type = Drop_Type.NORMAL, keywords = []) {
		this.name = name;
		this.droprate = droprate;
		this.type = type;	// 0: normal, 1: pponly, 2: conditional
		this.condition = item_condition_none;
		this.keywords = [];
	}

	roll_for_drop(bonus_drop_rate) {
		if (this.type != Drop_Type.CONDITIONAL) {
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

class Player {
	// Contains all the player stats to modify a zone for simulation purposes.

	constructor() {
		this.item_drop = 0;
		this.monster_level = 0;
		this.combat_mod = 0;
		this.meat_drop = 0;
		this.init = 0;
		this.inventory = {};
		this.pp = PP_Type.NONE;
	}
	
	reset() {
		this.inventory = {};		
	}
	
	add_item_to_inventory(name, count = 1) {
		if (!(name in this.inventory)) {
			if (count > 0) {
				this.inventory[name] = count;
			}
		} else if (this.inventory[name] + count > 0) {
			this.inventory[name] += count;
		} else {
			delete this.inventory[name];
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
		this.current_items = [];
		this.condition = condition_none;
	}
	
	add_items(item_list) {
		for (let i of item_list) {
			this.items.push(i);
		}
	}
	
	reset() {
		// reset the items that have dropped
		this.current_items = [];
		for (let i of this.items) {
			this.current_items.push(i);
		}
	}
	
	pp_item(player) {
		// Attempts to pickpocket an item.
		
		// Note, additional pickpocket attempts are NOT yet implemented. This is a TODO for a future enhancement.
		
		// refer to http://kol.coldfront.net/thekolwiki/index.php/Pickpocket for detailed mechanics that this function is based off of.
		
		// Note, this will "perform" all possible pickpocketing functions. So for example, a moxie class can pickpocket and then use an XO skeleton hug. This function will attempt to do both.
		
		if (player.pp == PP_Type.NONE) {
			// Maybe make an exception? If we're specifically using an item to call this?...
			return;
		}
		
		// The types of PP should be set in priority order since the function just goes linearly from here.
		
		// Normal pickpocketing.
		if ((player.pp & PP_Type.NORMAL) >> PP_Shift.NORMAL) {		
			
			// check for PPonly items.
			let eligible_items = [];
			
			for (let i = 0; i < this.current_items.length; ++i) {			
				if (this.current_items[i].type == Drop_Type.PPONLY) {
					eligible_items.push(i);
				}
			}
			
			if (eligible_items.length > 0) {
				shuffle_array(eligible_items);
				for (let i = 0; i < eligible_items.length; ++i) {
					if (this.current_items[eligible_items[i]].roll_for_drop(0)) {
						player.add_item_to_inventory(this.current_items[eligible_items[i]].name);
						// Remove the drop from the current item list.
						this.current_items.splice(eligible_items[i], 1);
						break;
					}				
				}
			}
			
			eligible_items = [];

			// Conditional items???? TODO: Verify how conditional items work. For now, assuming that conditional drops CANNOT be pickpocketed.
			for (let i = 0; i < this.current_items.length; ++i) {
				if (this.current_items[i].type != Drop_Type.CONDITIONAL && this.current_items[i].type != Drop_Type.PPONLY) {
					eligible_items.push(i);
				}
			}
			
			if (eligible_items.length > 0) {
				shuffle_array(eligible_items);
				for (let i = 0; i < eligible_items.length; ++i) {
					if (this.current_items[eligible_items[i]].roll_for_drop(0)) {
						player.add_item_to_inventory(this.current_items[eligible_items[i]].name);
						// Remove the drop from the current item list.
						this.current_items.splice(eligible_items[i], 1);
						break;
					}
				}
			}
		}
		// End of normal pickpocketing code.
		
		// XO SKELETON pickpocketing.		
		if ((player.pp & PP_Type.XO_SKELETON) >> PP_Shift.XO_SKELETON) {			
			// Hugs and Kisses
			// http://kol.coldfront.net/thekolwiki/index.php/Hugs_and_Kisses!
			// Basically, a random eligible item is selected and dropped.
			let eligible_items = [];
			
			// Conditional items???? TODO: Verify how conditional items work. For now, assuming that conditional drops CANNOT be pickpocketed.
			for (let i = 0; i < this.current_items.length; ++i) {
				if (this.current_items[i].type != Drop_Type.CONDITIONAL && this.current_items[i].type != Drop_Type.PPONLY) {
					eligible_items.push(i);
				}
			}
						
			if (eligible_items.length > 0) {
				shuffle_array(eligible_items);
				player.add_item_to_inventory(this.current_items[eligible_items[0]].name);
				this.current_items.splice(eligible_items[0], 1);
			}
		}
		// end of XO Skeleton pickpocketing.
	}

    drop_items(player) {
		
        // go through and drop items based on item find.
		
		let eligible_items = [];
		
		for (let i of this.current_items) {
			if (i.type == Drop_Type.PPONLY) {
				continue;
			} else if (i.type == Drop_Type.CONDITIONAL) {
				if (i.condition.evaluate(player)) {
					eligible_items.push(i);
				}
			} else {
				eligible_items.push(i);
			}
		}
				
		// for each item, attempt to drop it.
		for (let i of eligible_items) {
			if (i.roll_for_drop(player.item_drop)) {
				player.add_item_to_inventory(i.name);
				// For simulation speed purposes, assume that we won't be looking at the item list again in the future.
				// Uncomment below if we do.
				// The below code actually isn't correct. Look at XO Skeleton to fix.
				// var i = this.current_items.indexOf(eligible_items[ri]);
				// this.current_items.splice(i, 1);
			}
		}
		
		// TODO: SLIMELING DISGORGING CODE -- sample python code below.
		/*         if character.familiar.name == "Slimeling":
            disgorgeList = []
            for i in availableItems:
                if "equipment" in i.itemKeywords: disgorgeList.append(i)
            if len(i) > 0:
                itemSelected = random.choice(disgorgeList)
                # NOTE below is being calculated for now. This should be a function of the familiar in question. 
                slimelingFairyBonus = (55*character.familiar.weight)**0.5 + character.familiar.weight - 3
                if (itemSelected.rollForDrop(slimelingFairyBonus)):
                    character.addItemToInventory(itemSelected.name, 1)
                    availableItems.remove(itemSelected)
		*/

    }

    do(zone, player) {
        zone.turn_count += 1;
		// Attempt to pickpocket. Only for combat encounters.
		// Combat superlikely encounters should have custom code?
		if (this.type == Encounter_Type.COMBAT) {
			this.pp_item(player);
		}
        // by default drop items. add this code in later...?
        this.drop_items(player);
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
		
		// reset each encounter if needed.
		for (let e of this.c_list) {
			e.reset();
		}
		for (let e of this.nc_list) {
			e.reset();
		}
		for (let e of this.sl_list) {
			e.reset();
		}
	}

    add_encounters(e_list) {
        let eid = 0;
        for (let e of e_list) {
            e.id = eid;
            if (e.type == Encounter_Type.COMBAT) {
                this.c_list.push(e);
            } else if (e.type == Encounter_Type.NON_COMBAT) {
                this.nc_list.push(e);
            } else {
                this.sl_list.push(e);
            }
            eid++;
        }
    }

    // https://cdn.discordapp.com/attachments/466966826165731328/475465031161479168/Encounter_Hierarchy_.png
	pick_adventure(player, do_adv = true) {

        // Ignores hard-coded adventures, wandering adventures, clover adventures, and semi-rare adventures.
        let possible_encounters = [];
        let selected_encounter;
        // 1. Superlikely available?
        if (this.sl_list.length > 0) {
            // 1-1. Check conditions

            for (let e of this.sl_list) {
                if (e.condition.evaluate(this, player)) {
                    possible_encounters.push(e);
                }
            }

            // 1-2. Conditions satisfied? Randomly select with equal chance all SLs w/ conditions satisfied.
            if (possible_encounters.length > 0) {
                selected_encounter = possible_encounters[Math.floor(xrand.next_uniform() * possible_encounters.length)];
                if (do_adv) selected_encounter.do(this, player);
                return selected_encounter;
            }
        }

        // 2. Non-combat / combat selection
        if (xrand.next_uniform() >= this.combat_rate + player.combat_mod) {
            // non-combat selected

            // 2-NC-1: Build NC list
            for (let e of this.nc_list) {
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
                    for (let q of this.ncq) {
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
                        this.ncq.push(selected_encounter.id);
						if (this.ncq.length > 5) {
							this.ncq.shift();
						}
                        if (do_adv) selected_encounter.do(this, player);
                        return selected_encounter;
                    }

                    // else, if we're here, the noncombat got rejected, reroll (75% chance)
                }
            }
        }

        // 2-C-1: Build Combat list - Either we rolled a combat OR there are no eligible non-combats
        for (let e of this.c_list) {
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
            for (let q of this.cq) {
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
                this.cq.push(selected_encounter.id);
				if (this.cq.length > 5) {
					this.cq.shift();
				}
                if (do_adv) selected_encounter.do(this, player);
                return selected_encounter;
            }
            // else, if we're here, the combat got rejected, reroll (75% chance)
        }
	}
}


