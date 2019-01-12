let p = new Player();
p.combat_mod = -0.1;

// Create zone object
let spooky_forest = new Zone("spooky forest", 0.85);
spooky_forest.reset = function() {
    this.turn_count = 0;
    this.quest_marker = 0;

    this.cq = [];
    this.ncq = [];

    this.turns_since_nc = 0;
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
    zone.turns_since_nc = 0;
    zone.quest_marker += 1;
    zone.turns_taken += 1;
}
// SUPERLIKELY ADVENTURES
let arboreal_respite_sl = new Encounter("Arboreal Respite", Encounter_Type.SUPERLIKELY);
var condition_arboreal_respite_sl = {
    delay: -1,
    evaulate : function(zone, player) {
        if (delay == -1) {
            // initialize
            if (xrand.next % 2 == 0) {
                delay = 8;
            } else {
                delay = 7;
            }
            return false;
        }

        if (zone.turns_since_nc < delay) {
            return false;
        }
        return true;
    },
}
arboreal_respite_sl.condition = condition_arboreal_respite_sl;
arboreal_respite_sl.do = function(zone, player) {
    zone.turns_since_nc = 0;
    zone.quest_marker += 1; // proxy for quest items.
    zone.turns_taken += 1;
}

// add encounters to zone.
// might be easier to add the zones in the encounter constructor function, but there are instances where monsters can span multiple zones...
spooky_forest.add_encounters([spooky_mummy, bar, spooky_vampire, triffid, warwelf, wolfman, arboreal_respite, arboreal_respite_sl]);





class tt_sim {

    select_tt_adv() {

        if (xrand.next_uniform() < this.base_c_rate + c_mod) {
            // combat selected

            // Decide if we fight a drunken rat king, or not.
            if (xrand.next_uniform() <= (ml_mod / this.max_ml_rate)) {
                this.king_count += 1;
                this.turns_taken += 1;
            } else {
                this.turns_taken += 1;
            }
        } else {
            // non-combat selected.
            // For simplicity's sake, we just "reorder" the NC's so that the ones we can skip are indexed to [0, num_elemental_skips - 1]
            let selected_nc = -1;
            // Select a random NC.
            selected_nc = xrand.next() % 4;

            // Check if this NC takes a turn.
            if (selected_nc < num_elemental_skips) {
                // takes no turn!
            } else {
                this.turns_taken += 1;
            }
        }

    };

    run_sim() {

        // Assumes we use the optimal path.
        // We will explore 3 "x" squares, followed by 3 "A/C" squares, then explore the "B" squares.
        // First explore the "x" squares.

        this.select_tt_adv();
        this.select_tt_adv();
        this.select_tt_adv();

        // Since the queue does not apply the order doesn't matter. Just increment a turn for the corpse and do 2 more adventures in "A/C"
        this.turns_taken += 1; // corpse adventure
        this.select_tt_adv();
        this.select_tt_adv();

        // Now we adventure in the B section until we find the faucet.
        let faucet_adv = xrand.next() % 4;

        while (faucet_adv != 0) {
            faucet_adv -= 1;
            this.select_tt_adv();
        }
        // Find the faucet. takes a turn to turn off.
        this.turns_taken += 1;
    };

    reset() {
        this.turns_taken = 0;
        this.king_count = 0;
    }
}

let tt = new tt_sim();

let values_turns = [];
let values_kings = [];

let total_turns = 0;
let total_rat_kings = 0;
let sim_number = 0;

function simulate_tt(num_trials) {

    // for now, simple...

    values_turns = [];
    values_kings = [];

    total_turns = 0;
    total_rat_kings = 0;
    sim_number = 0;

    while (sim_number < num_trials) {
        tt.reset();
        tt.run_sim();
        total_turns += tt.turns_taken;
        total_rat_kings += tt.king_count;
        sim_number += 1;
        values_turns.push(tt.turns_taken);
        values_kings.push(tt.king_count);
    }

    // console.log("Avg turns to complete: " + Math.round(total_turns * 100 / num_trials, 2) / 100);
    // console.log("Avg rat kings: " + Math.round(total_rat_kings * 100 / num_trials, 2) / 100);
}

let tt_nc_ele_map = new Map();
let avg_turn_array = new Array(11).fill(0).map(() => new Array(5).fill(0));


function sim_tt_nc_elements(num_trials = 1000) {
    // Calculate the distribution for # of turns that it takes to complete the quest at varying levels of NC and elemental damage.

	let t0 = performance.now();
	values_turns = [];

    for (let ncr = -0.25; ncr <= 0.25; ncr += 0.05) {
        // Vary noncombat rate from -0.25 to 0.25 by increments of 0.05
        c_mod = Math.round(100 * ncr) / 100;
        for (let elec = 0; elec <= 4; elec++) {
            // Vary the number of elements that we have from 0 to 4
            num_elemental_skips = elec;

            simulate_tt(num_trials);

            tt_nc_ele_map.set([c_mod, num_elemental_skips], values_turns);
        }
    }

    // Display results... somewhere...

    // Calculate average turns taken...
    // 11 x 5 array



    for (let [k, v] of tt_nc_ele_map.entries()) {

        let nc_index = Math.round((k[0] + 0.25) / 0.05, 0);
        let ele_index = k[1];

        // v contains all the turns.
        let temp_sum = 0;
        for (let i = 0; i < v.length; ++i) {
            temp_sum += v[i];
        }
        avg_turn_array[nc_index][ele_index] = Math.round(temp_sum * 100 / v.length) / 100;
    }

	let t1 = performance.now();

	console.log("sim_tt_nc_elements @ " + num_trials + " took " + (t1 - t0) + " ms.");

	let col_names = [];
	col_names.push("");
	for (let i = 0; i < 5; ++i) {
		col_names.push(i);
	}

	let row_names = [];
	for (let i = -0.25; i <= 0.25; i += 0.05) {
		row_names.push(Math.round(i * 100) + "%");
	}

    create_table(avg_turn_array, row_names, col_names, "nc_ele_table");
}


let tt_nc_ml_map = new Map();
let tt_nc_ml_map_capped = new Map();
let ml_step = 25;
let ml_num_steps = Math.ceil(300 / ml_step);
let avg_king_array = new Array(11).fill(0).map(() => new Array(ml_num_steps).fill(0));
let avg_king_array_capped = new Array(11).fill(0).map(() => new Array(ml_num_steps).fill(0));

function sim_tt_nc_ml(num_trials = 1000) {
    // Calculate the distribution for # of turns that it takes to complete the quest at varying levels of NC and elemental damage.

	let t0 = performance.now();
	values_kings = [];

    for (let ncr = -0.25; ncr <= 0.25; ncr += 0.05) {
        // Vary noncombat rate from -0.25 to 0.25 by increments of 0.05
        c_mod = Math.round(100 * ncr) / 100;
        for (let ml = 0; ml <= ml_num_steps; ++ml) {
            // Vary the amount of ML that we have from 0 to 300
            ml_mod = ml * ml_step;
            simulate_tt(num_trials);
            tt_nc_ml_map.set([c_mod, ml], values_kings);

			// Do the calculation for net benefit here as well. Main reason being that we want to cap tangles at 3 and would be nice to not rerun the tables...
			for (let i = 0; i < values_kings.length; ++i) {
				if (values_kings[i] > 3) {
					// cap at 3.
					values_kings[i] = 3;
				}
			}

			tt_nc_ml_map_capped.set([c_mod, ml], values_kings);
        }
    }
    // Calculate average turns taken...

    for (let [k, v] of tt_nc_ml_map.entries()) {

        let nc_index = Math.round((k[0] + 0.25) / 0.05, 0);
        let ml_index = k[1];

        let temp_sum = 0;
        for (let i = 0; i < v.length; ++i) {
            temp_sum += v[i];
        }
        avg_king_array[nc_index][ml_index] = Math.round(temp_sum * 100 / v.length) / 100;
    }

	// Repeat for capped kings
	for (let [k, v] of tt_nc_ml_map_capped.entries()) {

        let nc_index = Math.round((k[0] + 0.25) / 0.05, 0);
        let ml_index = k[1];

        let temp_sum = 0;
        for (let i = 0; i < v.length; ++i) {
            temp_sum += v[i];
        }
        avg_king_array_capped[nc_index][ml_index] = Math.round(temp_sum * 100 / v.length) / 100;
    }

	let t1 = performance.now();

	console.log("sim_tt_nc_ml @ " + num_trials + " took " + (t1 - t0) + " ms.");

	let col_names = [];
	col_names.push("");
	for (let i = 0; i <= 300; i += ml_step) {
		col_names.push(i);
	}

	let row_names = [];
	for (let i = -0.25; i <= 0.25; i += 0.05) {
		row_names.push(Math.round(i * 100) + "%");
	}

    create_table(avg_king_array, row_names, col_names, "nc_ml_table", true);
}


function create_table_dom(tdata, trow = [], tcolumn = [], id_name = "") {
    let table = document.createElement("table");
    let table_body = document.createElement("tbody");

	if (tcolumn != []) {
		let first_row = document.createElement("tr");
		tcolumn.forEach(function(cell_data) {
			let cell = document.createElement("th");
			cell.appendChild(document.createTextNode(cell_data));
			first_row.appendChild(cell);
		});
		table_body.appendChild(first_row);
	}

	for (let i = 0; i < tdata.length; ++i) {

		let row_data = tdata[i];
        let row = document.createElement("tr");

		if (trow != []) {
			let cell = document.createElement("th");
			cell.appendChild(document.createTextNode(trow[i]));
			row.appendChild(cell);
		}

        row_data.forEach(function(cell_data) {
            let cell = document.createElement("td");
            cell.appendChild(document.createTextNode(cell_data));
            row.appendChild(cell);
        });

        table_body.appendChild(row);
	}


    table.appendChild(table_body);
	document.getElementById(id_name).appendChild(table);
}

function create_table(tdata, trow = [], tcolumn = [], id_name = "", reverse_bg = false) {
	let h = "<table>";

	if (tcolumn != []) {
		h += "<tr>"
		tcolumn.forEach(function(cell_data) {
			h += "<th>";
			h += cell_data;
			h += "</th>";
		});
		h += "</tr>";
	}
	let vmax = get_max(tdata);
	let vmin = get_min(tdata);

	for (let i = 0; i < tdata.length; ++i) {
		h += "<tr>";
		if (trow != []) {
			h += "<th>";
			h += trow[i];
			h += "</th>";
		}

		let row_data = tdata[i];
        row_data.forEach(function(cell_data) {
            // h += "<td>";
			// let l = (cell_data - vmin) / vmax * 100;
			let l = (vmax - cell_data) / (vmax - vmin) * 100;
			if (reverse_bg) {
				l = (cell_data - vmin) / (vmax - vmin) * 100;
			}


			let tc = l < 50? "#FFF" : "#000";
			h += '<td style="background: hsl(120, 50%, ' + l + '%); color: ' + tc + '">';
            h += cell_data;
            h += "</td>";
        });
		h += "</tr>";
	}
	h += "</table>"
	document.getElementById(id_name).innerHTML = h;
}

function get_max(a){
  return Math.max(...a.map(e => Array.isArray(e) ? get_max(e) : e));
}

function get_min(a){
  return Math.min(...a.map(e => Array.isArray(e) ? get_min(e) : e));
}


let ns = 1000;
sim_tt_nc_elements(ns);
sim_tt_nc_ml(ns);
let ele_skips = Number(document.getElementById("ele_skips_dropdown").value);
let tangle_turns = Number(document.getElementById("tangle_turns_saved").value);
let net_turns_array = new Array(11).fill(0).map(() => new Array(ml_num_steps).fill(0));
update_net_turns_saved();

function change_ele_skips_dropdown(select) {
	ele_skips = select.value;
	update_net_turns_saved();
}

function change_tangle_turns(select) {
	tangle_turns = Number(document.getElementById("tangle_turns_saved").value);
	update_net_turns_saved();
}


function update_net_turns_saved() {
	// Take the NC by ML table and convert to turns saved and then add to all columns, the value of the selected # of elemental skips.

	for (let i = 0; i < avg_king_array_capped.length; ++i) {
		for (let j = 0; j < avg_king_array_capped[i].length; ++j) {
			// Convert to turns saved.
			net_turns_array[i][j] = -tangle_turns * avg_king_array_capped[i][j];

			// Add in turns taken at selected elemental skip level.
			net_turns_array[i][j] += avg_turn_array[i][ele_skips];

			net_turns_array[i][j] = Math.round(net_turns_array[i][j]*100)/100;
		}
	}

	let col_names = [];
	col_names.push("");
	for (let i = 0; i <= 300; i += ml_step) {
		col_names.push(i);
	}

	let row_names = [];
	for (let i = -0.25; i <= 0.25; i += 0.05) {
		row_names.push(Math.round(i * 100) + "%");
	}
	create_table(net_turns_array, row_names, col_names, "net_turns_table");
}



// Populate a dropdown programmatically...
let ncdd_html = "Combat modifier: <select id = 'nc_dropdown_value'>";
for (let i = -0.25; i <= 0.25; i += 0.05) {

	let i2 = Math.round(i * 100) / 100;
	let i3 = Math.round(i*100) + "%";


	ncdd_html += "<option value = " + i2 + ">" + i3 + "</option>";

}

ncdd_html += "</select>";
document.getElementById("nc_dropdown").innerHTML = ncdd_html;


function tt_run_dist_analysis() {

	let t0 = performance.now();

	// Get inputted values
	c_mod = Number(document.getElementById("nc_dropdown_value").value);
	ml_mod = Number(document.getElementById("monster_level_dist").value);
	num_elemental_skips = Number(document.getElementById("ele_skips_dropdown_distribution").value);
	let nt = Number(document.getElementById("dist_num_sims").value);

	simulate_tt(nt);

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

    // create a frequency chart
    let kings_freq_map = d3.rollup(values_kings, v=>v.length, d=>d);

    let sorted_map_k = new Map(Array.from(kings_freq_map).sort((a, b) => {return a[0] - b[0];}));
    let king_freq_x = [...sorted_map_k.keys()];
    let king_freq_y = [...sorted_map_k.values()];

    // calculate freq as a %.
    for (let i = 0; i < king_freq_y.length; ++i) {
        king_freq_y[i] = king_freq_y[i] / nt;
    }

    let king_freq_cumulative_y = [];
    king_freq_y.reduce(function(a,b,i) { return king_freq_cumulative_y[i] = a+b; },0);

    let trace1k = {
        x: values_kings,
        type: 'histogram',
        histnorm: 'probability',
        name: 'Probability',
    };
    let trace2k = {
        x: king_freq_x,
        y: king_freq_cumulative_y,
        name: 'CDF',
        // mode: 'lines',
        // histfunc: 'count',
        // histnorm: 'probability',
    }
    let data_k = [trace1k, trace2k];
    let layout_k = {
        title: 'Distribution of rat kings encountered',
    }
    Plotly.newPlot('dist_hist_kings', data_k, layout_k);



	let t1 = performance.now();

	console.log("tt_run_dist_analysis @ " + nt + " took " + (t1 - t0) + " ms.");
}
