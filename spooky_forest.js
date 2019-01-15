let number_simulations = 100000;

let p = new Player();
p.combat_mod = -0.1;

// Create zone object
let spooky_forest = new Zone("spooky forest", 0.85);
spooky_forest.reset = function() {
    this.turn_count = 0;
    this.quest_marker = 0;

    this.cq = [];
    this.ncq = [];

    this.last_nc_turn = 0;
}

// Create adventures

// COMBAT ADVENTURES
// Note: For this initial implementation, we use dummy monsters since we don't actually care about them
let spooky_mummy = new Encounter("spooky mummy", Encounter_Type.COMBAT);
let bar = new Encounter("bar", Encounter_Type.COMBAT);
let spooky_vampire = new Encounter("spooky vampire", Encounter_Type.COMBAT);
let triffid = new Encounter("triffid", Encounter_Type.COMBAT);
let warwelf = new Encounter('warwelf', Encounter_Type.COMBAT);
let wolfman = new Encounter("wolfman", Encounter_Type.COMBAT);

// NC ADVENTURES
let arboreal_respite = new Encounter("Arboreal Respite", Encounter_Type.NON_COMBAT);
arboreal_respite.condition = Object.assign({}, condition_delay);
arboreal_respite.condition.delay = 5;
arboreal_respite.do = function(zone, player) {
    zone.last_nc_turn = zone.turn_count;
    zone.quest_marker += 1;
    zone.turn_count += 1;
}
// SUPERLIKELY ADVENTURES
let arboreal_respite_sl = new Encounter("Arboreal Respite", Encounter_Type.SUPERLIKELY);
var condition_arboreal_respite_sl = {
    delay: -1,
    evaluate : function(zone, player) {
        if (zone.turn_count == 0) {
            // initialize
            if (xrand.next() % 2 == 0) {
                this.delay = 8;
            } else {
                this.delay = 7;
            }
            return false;
        }

        if (zone.turn_count - zone.last_nc_turn < this.delay) {
            return false;
        }
		if (xrand.next() % 2 == 0) {
			this.delay = 8;
		} else {
			this.delay = 7;
		}
        return true;
    },
}
arboreal_respite_sl.condition = condition_arboreal_respite_sl;
arboreal_respite_sl.do = function(zone, player) {
    zone.last_nc_turn = zone.turn_count;
    zone.quest_marker += 1; // proxy for quest items.
    zone.turn_count += 1;
}

// add encounters to zone.
// might be easier to add the zones in the encounter constructor function, but there are instances where monsters can span multiple zones...
spooky_forest.add_encounters([spooky_mummy, bar, spooky_vampire, triffid, warwelf, wolfman, arboreal_respite, arboreal_respite_sl]);
spooky_forest.reset();

var run_sim = function(get_fert = true) {
	
	// Runs through a single simulation of the spooky forest.
	
	this.quest_target = 4;
	if (get_fert) { this.quest_target += 1; };
	
	spooky_forest.reset();
	
	while (spooky_forest.quest_marker < this.quest_target) {
		spooky_forest.pick_adventure(p);
	}
};

var run_step_sim = function() {
	
	// Runs through a stepwise simulation of the spooky forest.
	
	// Basically, the first time this function is called, we run a simulation up to right before a fertilizer is needed. That is: quest_marker == 4.
	// Then, when we run it again, we are just looking for the fertilizer. This adds correlation between simulations but is probably fine since in run you would be making the decision
	// to pull or not pull the fertilizer after the main quest is complete anyway. This reduces the simulations needed by about half.
	
	if (spooky_forest.quest_marker == 5 || spooky_forest.quest_marker == 0) {
		// we've completed the quest, and gotten fertilizer, reset the quest.
		spooky_forest.reset();
		this.quest_target = 4;
	} else {
		// Find the fertilizer.
		this.quest_target = 5;
	}
	
	while (spooky_forest.quest_marker < this.quest_target) {
		spooky_forest.pick_adventure(p);
	}
	
}


let values_turns = [];
let values_turns_fert = [];
let total_turns = 0;
let total_turns_fert = 0;
let sim_number = 0;

var simulate_spooky_forest = function(num_trials) {
	
	// initialize variables for storage
	
	values_turns = [];
	values_turns_fert = [];
	total_turns = 0;
	total_turns_fert = 0;
	sim_number = 0;
	
	while(sim_number < num_trials) {
		run_step_sim();
		total_turns += spooky_forest.turn_count;
		values_turns.push(spooky_forest.turn_count);
		run_step_sim();
		total_turns_fert += spooky_forest.turn_count;
		values_turns_fert.push(spooky_forest.turn_count);
		sim_number += 1;
	}
	
	// console.log("Avg turns to complete (no fert): " + Math.round(total_turns * 100 / num_trials, 2) / 100);    
	// console.log("Avg turns to complete (fert): " + Math.round(total_turns_fert * 100 / num_trials, 2) / 100);    
};

let sf_nc_map = new Map();
let avg_turn_array = new Array(11).fill(0).map(() => new Array(2).fill(0));
let avg_pull_fert_savings = new Array(11).fill(0).map(() => new Array(1).fill(0));

function sim_sf_nc(num_trials = number_simulations) {
    // Calculate the distribution for # of turns that it takes to complete the quest at varying levels of NC.

	let t0 = performance.now();
	values_turns = [];
	values_turns_fert = [];

    for (let ncr = -0.25; ncr <= 0.25; ncr += 0.05) {
        // Vary noncombat rate from -0.25 to 0.25 by increments of 0.05
		p.combat_mod = ncr;
        c_mod = Math.round(100 * ncr) / 100;
        
		simulate_spooky_forest(num_trials);
		sf_nc_map.set([c_mod, 0], values_turns);
		sf_nc_map.set([c_mod, 1], values_turns_fert);
    }

    // Calculate average turns taken...

    for (let [k, v] of sf_nc_map.entries()) {

        let nc_index = Math.round((k[0] + 0.25) / 0.05, 0);
        let fert_index = k[1];

        // v contains all the turns.
        let temp_sum = 0;
        for (let i = 0; i < v.length; ++i) {
            temp_sum += v[i];
        }
        avg_turn_array[nc_index][fert_index] = Math.round(temp_sum * 100 / v.length) / 100;
    }

	let t1 = performance.now();

	console.log("sim_sf_nc @ " + num_trials + " took " + (t1 - t0) + " ms.");

	let col_names = [];
	col_names.push("");
	col_names.push("Pulling Fertilizer");
	col_names.push("Farming Fertilizer");
	
	let row_names = [];
	for (let i = -0.25; i <= 0.25; i += 0.05) {
		row_names.push(Math.round(i * 100) + "%");
	}

    create_table(avg_turn_array, row_names, col_names, "sf_nc_table");
	
	col_names = ["Combat_Mod", "Turns Saved"];	
	row_names = [];
	for (let i = 0; i < avg_turn_array.length; i += 1) {		
		avg_pull_fert_savings[i][0] = Math.round(100 * (avg_turn_array[i][1] - avg_turn_array[i][0])) / 100;		
	}
	for (let i = -0.25; i <= 0.25; i += 0.05) {				
		row_names.push(Math.round(i * 100) + "%");
	}
	
	create_table(avg_pull_fert_savings, row_names, col_names, "sf_fert_value");	
}


sim_sf_nc(number_simulations);

// Populate a dropdown programmatically...
let ncdd_html = "Combat modifier: <select id = 'nc_dropdown_value'>";
for (let i = -0.25; i <= 0.25; i += 0.05) {
	let i2 = Math.round(i * 100) / 100;
	let i3 = Math.round(i*100) + "%";
	ncdd_html += "<option value = " + i2 + ">" + i3 + "</option>";
}
ncdd_html += "</select>";
document.getElementById("nc_dropdown").innerHTML = ncdd_html;

function sf_run_dist_analysis() {

	let t0 = performance.now();

	// Get inputted values
	p.combat_mod = Number(document.getElementById("nc_dropdown_value").value);
	let nt = Number(document.getElementById("dist_num_sims").value);
	let fert = document.getElementById("fert_flag").value;

	simulate_spooky_forest(nt);

	// create a frequency chart
	let vt;
	if (fert == "Yes") {
		vt = values_turns_fert;
	} else {
		vt = values_turns;
	}
    let turn_freq_map = d3.rollup(vt, v=>v.length, d=>d);

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
		x: vt,
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
