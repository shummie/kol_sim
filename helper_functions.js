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