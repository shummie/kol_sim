// derived from https://github.com/davidbau/xsrand/blob/master/xor128.js
function Xor128(seed) {
    let me = this;

    // set up generator function
    me.next = function() {
        let t = me.x ^ (me.x << 11);
        me.x = me.y;
        me.y = me.z;
        me.z = me.w;
        return me.w ^= (me.w >> 19) ^ t ^ (t >> 8);
    };

    me.next_uniform = function() {
        return (me.next() % 10000) / 10000;
    }

    function init(me, seed) {
        me.x = seed;
        me.y = 0;
        me.z = 0;
        me.w = 0;

        // Discard an initial batch of 64 values.
        for (let k = 64; k > 0; --k) {
            me.next();
        }
    }

    init(me, seed);
}

var xrand = new Xor128((new Date).getTime());

function get_max(a){
	return Math.max(...a.map(e => Array.isArray(e) ? get_max(e) : e));
}

function get_min(a){
	return Math.min(...a.map(e => Array.isArray(e) ? get_min(e) : e));
}

function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// FUNCTIONS TO CREATE HTML TABLES /////////////

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