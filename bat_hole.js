let number_simulations = 5000;
let page_load_start = performance.now();
document.getElementById("page_sims").innerHTML = number_simulations;
let p = new Player();


// Create zone object
let screambat_counter = 9;
let zones_opened = 0;
let reset_bat_hole = function() {
	screambat_counter = 9;
	zones_opened = 0;
	guano_junction.reset();
	batrat_burrow.reset();
	beanbat_chamber.reset();
	boss_bat_lair.reset();
}

// Superlikely adventures
// Screambat is a special SL that looks at the entire bat hole.
let screambat_sl = new Encounter("screambat", Encounter_Type.SUPERLIKELY);
var condition_screambat_sl = {
    evaluate : function(zone, player) {
		if (zones_opened >= 3) { return false; }
		screambat_counter -= 1;
        if (screambat_counter == 0) {
			screambat_counter = 8;
            return true;
        }
        return false;
    },
}
screambat_sl.condition = condition_screambat_sl;
screambat_sl.do = function(zone, player) {
    zones_opened += 1;
    zone.turn_count += 1;
}

let guano_junction = new Zone("guano junction", 1.00);

let baseball_bat = new Encounter("baseball bat", Encounter_Type.COMBAT);
let briefcase_bat = new Encounter("briefcase bat", Encounter_Type.COMBAT);
let doughbat = new Encounter("doughbat", Encounter_Type.COMBAT);
let perpendicular_bat = new Encounter("perpendicular bat", Encounter_Type.COMBAT);
let skullbat = new Encounter("skullbat", Encounter_Type.COMBAT);
let vampire_bat = new Encounter("vampire bat", Encounter_Type.COMBAT);

let baseball = new Item("baseball", 0.30);
let sonar_10 = new Item("sonar-in-a-biscuit", 0.10);
baseball_bat.add_items([baseball, sonar_10]);

let bat_guano = new Item("bat guano", 0.10);
let briefcase = new Item("briefcase", 0.4);
briefcase_bat.add_items([bat_guano, briefcase, sonar_10]);

let wad_of_dough = new Item("wad of dough", 0.30);
doughbat.add_items([wad_of_dough, sonar_10]);

let batgut = new Item("batgut", 0.15);
let bat_wing = new Item("bat_wing", 0.15);
perpendicular_bat.add_items([bat_wing, batgut, sonar_10]);

let broken_teeth = new Item("broken teeth", 0.4);
let loose_teeth = new Item("loose_teeth", 0.2);
let sonar_15 = new Item("sonar-in-a-biscuit", 0.15);
skullbat.add_items([broken_teeth, loose_teeth, sonar_15]);

vampire_bat.add_items([batgut, bat_wing, sonar_10]);

guano_junction.add_encounters([baseball_bat, briefcase_bat, doughbat, perpendicular_bat, skullbat, vampire_bat, screambat_sl]);
guano_junction.reset();

let batrat_burrow = new Zone("batrat and ratbat burrow", 1.00);

let batrat = new Encounter("batrat", Encounter_Type.COMBAT);
let ratbat = new Encounter("ratbat", Encounter_Type.COMBAT);

let bat_guano_15 = new Item("bat guano", 0.15);
batrat.add_items([bat_guano_15, batgut, bat_wing, sonar_15]);

let rat_appendix = new Item("rat appendix", 0.15);
let ratgut = new Item("ratgut", 0.15);
let ratarang = new Item("ratarang", 0.05, Drop_Type.PPONLY);
ratbat.add_items([rat_appendix, ratgut, ratarang, sonar_15]);

batrat_burrow.add_encounters([batrat, ratbat, screambat_sl]);
batrat_burrow.reset();

let beanbat_chamber = new Zone("beanbat chamber", 1.00);

let enchanted_beanbat = new Encounter("enchanted beanbat", Encounter_Type.COMBAT);
let enchanted_bean = new Item("enchanted bean", 0.5);

enchanted_beanbat.add_items([enchanted_bean, sonar_10]);

beanbat_chamber.add_encounters([enchanted_beanbat, screambat_sl]);
beanbat_chamber.reset();

let boss_bat_lair = new Zone("the boss bat lair", 1.00);

let beefy_bodyguard_bat = new Encounter("beefy bodyguard bat", Encounter_Type.COMBAT);

let boss_bat_sl = new Encounter("boss bat", Encounter_Type.SUPERLIKELY);
var condition_bossbat_sl = {
    evaluate : function(zone, player) {
		if (zone.turn_count <= 0) {
			this.delay = 4 + xrand.next() % 3;
		}
		if (zone.turn_count != this.delay) return false;
		return true;
    },
}
boss_bat_sl.condition = condition_bossbat_sl;
boss_bat_sl.do = function(zone, player) {
    zone.quest_marker += 1;
    zone.turn_count += 1;
}

// Ignoring drops from boss bat
boss_bat_lair.add_encounters([beefy_bodyguard_bat, boss_bat_sl]);
boss_bat_lair.reset();


// Runs a full simulation.

var run_sim = function() {

	// Runs through a single simulation of the bat hole.
	reset_bat_hole();
	let quest_turns = 0;

	// Note, this assumes that the player's inventory has been reset already. We don't reset in here because we may want to start the player off with some items.
	// This is a hack.
	// The boss bat zone doesn't really matter. It will always be completed within 5-7 turns.
	quest_turns += 5 + xrand.next() % 3;

	while (zones_opened < 3 || (!("enchanted bean" in p.inventory))) {


		// Do we want to add in yellow ray?
		if (zones_opened >= 2) {
			// Beanbat chamber is open. Do we have a bean?
			if ("enchanted bean" in p.inventory) {
				// get sonars in batrat
				// Add in the option to use 2 clovers...
				if ("ten-leaf clover" in p.inventory) {
					// Grab two sonar-in-a-biscuit
					quest_turns += 1;
					p.add_item_to_inventory("ten-leaf clover", -1);
					zones_opened = 3;
				} else {
					batrat_burrow.pick_adventure(p);
				}
			} else {
				// adventure in beanbat for a bean.
				if ("yellow ray" in p.inventory) {
					// Not really the proper way to run a yellow ray, but it'll do for now.
					quest_turns += 1;
					p.add_item_to_inventory("enchanted bean", 1);
					p.add_item_to_inventory("sonar-in-a-biscuit", 1);
				} else if ("hugs and kisses" in p.inventory) {					
					p.add_item_to_inventory("hugs and kisses", -1);
					p.pp |= PP_Type.XO_SKELETON;
					let adv = beanbat_chamber.pick_adventure(p, false);
					adv.pp_item(p);
					
					while ("macrometeorite" in p.inventory && zones_opened < 3 && !("sonar-in-a-biscuit" in p.inventory)) {
						adv.reset(); // In reality, we should reroll, but to speed this up, there's only one encounter anyway.
						adv.pp_item(p);						
						p.add_item_to_inventory("macrometeorite", -1);
					} 
					p.pp &= ~PP_Type.XO_SKELETON;					
					adv.drop_items(p);
					beanbat_chamber.turn_count++;
				} else {
					beanbat_chamber.pick_adventure(p);
				}
			}
		} else if (zones_opened == 1) {
			// If we only have 1 zone open, just farm.
			batrat_burrow.pick_adventure(p);
		} else {
			// only guano junction open.
			// If we have a ten-leaf clover in the inventory, use it.
			if ("ten-leaf clover" in p.inventory) {
				// Grab two sonar-in-a-biscuit
				quest_turns += 1;
				p.add_item_to_inventory("ten-leaf clover", -1);
				zones_opened += 2;
			} else {
				guano_junction.pick_adventure(p);
			}
		}

		// Use any sonars we have found.
		// We could be fancy and implement a "use" function on items. but right now, keep it fast.
		if ("sonar-in-a-biscuit" in p.inventory) {
			p.add_item_to_inventory("sonar-in-a-biscuit", -1);
			zones_opened += 1;
		}
	}
	quest_turns += guano_junction.turn_count + batrat_burrow.turn_count + beanbat_chamber.turn_count;

	return quest_turns;

};

// Scenario 1:
let basecase = {
    name: "No resources",
    reset: function() {
        p.reset();
    },
}

// Scenario 2:
let clover_1 = {
    name: "One clover",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 1);
    },
}

// Scenario 3:
let clover_2 = {
    name: "Two clovers",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 2);
    },
}

// Scenario 4:
let clover_YR = {
    name: "Clover + YR",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 1);
        p.add_item_to_inventory("yellow ray", 1);
    },
}

// Scenario 5:
let yellow_ray = {
    name: "Yellow Ray",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("yellow ray", 1);
    },
}

// Scenario 6:
let clover_1xo = {
    name: "Clover + 1 XO",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 1);
		p.add_item_to_inventory("hugs and kisses", 1);	 // This is a HACK!
    },
}

// Scenario 7:
let clover_2xo = {
    name: "Clover + 2 XO + 1 MM",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 1);
		p.add_item_to_inventory("hugs and kisses", 2);	 // This is a HACK!
		p.add_item_to_inventory("macrometeorite", 1);	 // This is a HACK!
    },
}

// Scenario 8:
let clover_3xo = {
    name: "Clover + 3 XO + 2 MM",
    reset: function() {
        p.reset();
        p.add_item_to_inventory("ten-leaf clover", 1);
		p.add_item_to_inventory("hugs and kisses", 3);	 // This is a HACK!
		p.add_item_to_inventory("macrometeorite", 2);	 // This is a HACK!
    },
}

let scenarios = [basecase, clover_1, clover_2, clover_YR, yellow_ray, clover_1xo];

let values_turns = [];
let total_turns = 0;
let sim_number = 0;

var simulate_bat_hole = function(num_trials = number_simulations, scenario = basecase) {

    // initialize variables for storage

    values_turns = [];
    total_turns = 0;
    sim_number = 0;

    let sim_total_turns = 0;

    while(sim_number < num_trials) {
        sim_total_turns = 0;
        scenario.reset();
        sim_total_turns = run_sim();
        total_turns += sim_total_turns;
        values_turns.push(sim_total_turns);
        sim_number += 1;
    }

    // console.log("Avg turns to complete (" + scenario.name + "): " + prettify(total_turns / num_trials));
};

let item_max = 7;
let item_step = 0.5;
let num_item_steps = Math.ceil(item_max / item_step);
let avg_turn_array = new Array(num_item_steps + 1).fill(0).map(() => new Array(scenarios.length).fill(0));
let avg_turn_savings_array = new Array(num_item_steps + 1).fill(0).map(() => new Array(5).fill(0));
let bh_map = new Map();

var simulate_bh_table = function(num_trials = number_simulations, table_suffix = "") {
	// Simulates for each scenario, and item drop %, the average number of turns to complete the bat hole quest.
	
	let t0 = performance.now();
	for (let si = 0; si < scenarios.length; si++) {
		let s = scenarios[si];
		for (let iindex = 0; iindex <= num_item_steps; iindex++) {
			p.item_drop = iindex * item_step;
			simulate_bat_hole(num_trials, s);
			// Do we even need to keep this map? 
			// bh_map.set([iindex, s.name]);
			// Calculate avg turns taken.
			let temp_sum = 0;
			for (let i = 0; i < num_trials; ++i) {
				temp_sum += values_turns[i];
			}
			avg_turn_array[iindex][si] = prettify(temp_sum / num_trials);
		}
	}

	let t1 = performance.now();

	console.log("sim_bh_table @ " + num_trials + " took " + (t1 - t0) + " ms.");

	let col_names = [];
	col_names.push("");
	for (let i = 0; i < scenarios.length; ++i) {
		col_names.push(scenarios[i].name);
	}

	let row_names = [];
	for (let i = 0; i <= num_item_steps; ++i) {
		row_names.push(Math.round(i * item_step * 100) + "%");
	}

	create_table(avg_turn_array, row_names, col_names, "if_turn_table" + table_suffix);
	
	
	// Create resource savings table
	// Note, if we add more scenarios, need to manually adjust this since we're comparing different columns.
	
	col_names = ["Item Drop", "First clover", "Second clover", "YR (1 clover)", "YR (no clovers)", "XO Hug (after clover)"];
	
	let base_scenario = 0;
	let compare_scenario = 0;
	let savings_index = 0;
	
	// compare first clover to base.
	compare_scenario = 1;
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_turn_savings_array[i][savings_index] = Math.round(100 * (avg_turn_array[i][base_scenario] - avg_turn_array[i][compare_scenario])) / 100;		
	}
	savings_index += 1;
	
	// compare second clover to first.
	base_scenario = 1;
	compare_scenario = 2;
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_turn_savings_array[i][savings_index] = Math.round(100 * (avg_turn_array[i][base_scenario] - avg_turn_array[i][compare_scenario])) / 100;		
	}
	savings_index += 1;
	
	// compare YR to 1 clover.
	base_scenario = 1;
	compare_scenario = 3;
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_turn_savings_array[i][savings_index] = Math.round(100 * (avg_turn_array[i][base_scenario] - avg_turn_array[i][compare_scenario])) / 100;		
	}
	savings_index += 1;
	
	// compare YR to base.
	base_scenario = 0;
	compare_scenario = 4;
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_turn_savings_array[i][savings_index] = Math.round(100 * (avg_turn_array[i][base_scenario] - avg_turn_array[i][compare_scenario])) / 100;		
	}
	savings_index += 1;
	
	// compare XO Hug with 1 clover.
	base_scenario = 1;
	compare_scenario = 5;
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_turn_savings_array[i][savings_index] = Math.round(100 * (avg_turn_array[i][base_scenario] - avg_turn_array[i][compare_scenario])) / 100;		
	}
	savings_index += 1;
	
	create_table(avg_turn_savings_array, row_names, col_names, "resource_value_table" + table_suffix);	
}

simulate_bh_table(number_simulations);
p.pp |= PP_Type.NORMAL;
simulate_bh_table(number_simulations, "_pp");

// Populate a dropdown programmatically...
let iddd_html = "Item drop modifier: <select id = 'id_dropdown_value'>";
for (let i = 0; i <= item_max; i += item_step) {
	let i2 = Math.round(i * 100) / 100;
	let i3 = Math.round(i*100) + "%";
	iddd_html += "<option value = " + i2 + ">" + i3 + "</option>";
}
iddd_html += "</select>";
document.getElementById("id_dropdown").innerHTML = iddd_html;


function bh_run_dist_analysis() {

	let t0 = performance.now();

	// Get inputted values
	p.item_drop = Number(document.getElementById("id_dropdown_value").value);
	let nt = Number(document.getElementById("dist_num_sims").value);
	let use_yr = document.getElementById("use_yr").value;
	let num_clovers = document.getElementById("num_clovers").value;
	let num_xo = document.getElementById("num_xo").value;
	
	let custom_scenario = {
		name: "Custom Scenario",
		reset: function() {
			p.reset();
			if (use_yr == "Yes") {
				p.add_item_to_inventory("yellow ray", 1);
			}
			p.add_item_to_inventory("ten-leaf clover", num_clovers);
			p.add_item_to_inventory("hugs and kisses", num_xo);
			if (num_xo > 1) {
				p.add_item_to_inventory("macrometeorite", num_xo - 1);	
			}
		},
	}

	simulate_bat_hole(nt, custom_scenario);

	// create a frequency chart
    let turn_freq_map = d3.rollup(values_turns, v=>v.length, d=>d);

    let sorted_map = new Map(Array.from(turn_freq_map).sort((a, b) => {return b[0] - a[0];}));
    let turn_freq_x = [...sorted_map.keys()];
    let turn_freq_y = [...sorted_map.values()];

    // calculate freq as a %.
    for (let i = 0; i < turn_freq_y.length; ++i) {
        turn_freq_y[i] = turn_freq_y[i] / nt;
    }

    let turn_freq_cumulative_y = [];
    turn_freq_y.reduce(function(a,b,i) { return turn_freq_cumulative_y[i] = a+b; },0);

	let trace1 = {
		x: values_turns,
		type: 'histogram',
		histnorm: 'probability',
        name: 'Probability',
	};
	let trace2 = {
		x: turn_freq_x,
        y: turn_freq_cumulative_y,
        name: 'CDF',
		// mode: 'lines',
		// histfunc: 'count',
		// histnorm: 'probability',
	}
	let data_turns = [trace1, trace2];
    let layout_turns = {
        title: 'Distribution of turns taken to complete zone',
    }
	Plotly.newPlot('dist_hist_turns', data_turns, layout_turns);

	let t1 = performance.now();

	console.log("sf_run_dist_analysis @ " + nt + " took " + (t1 - t0) + " ms.");
}

let page_load_end = performance.now();
document.getElementById("page_load_time").innerHTML = prettify((page_load_end - page_load_start) / 1000);