import WaveSurfer from './wavesurfer.esm.js'


const mixer = document.querySelector(".mixer");
const scroll_container = mixer.querySelector(".scroll-wrapper");
const slider = mixer.querySelector(".slider");
const timeline = mixer.querySelector(".timeline");
const track_list = mixer.querySelector(".track-list");
const play_button = mixer.querySelector("button.play-button");

const audio_controls = document.querySelector("#audio-controls");
const mute_button = audio_controls.querySelector("#mute");
const unmute_button = audio_controls.querySelector("#unmute");
const crop_button = audio_controls.querySelector("#crop");

let wavesurfer_map = new Map();
let total_wavesurfers = mixer.querySelectorAll('.audio-wrapper').length;
let ready_wavesurfers = 0;
let track_duration;

let draggable_audio;
let initial_audio_left;

let demo_playing = false;


function get_custom_property(property, styles) {
    const prop = styles.split(";").find(style => style.includes(property));
    const value = prop.slice(prop.indexOf(":") + 1);

    return value;
}


document.addEventListener("DOMContentLoaded", () => {
    slider.style.height = `${track_list.getBoundingClientRect().height + timeline.getBoundingClientRect().height}px`;

    track_duration = parseInt(get_custom_property("--_duration", mixer.style.cssText));

    for (let x = 0; x < track_duration; x++) {
        let grid_space = document.createElement("div");
        grid_space.classList.add("grid-space");

        if (x % 5 == 4) {
            // match with :nth-child(xn) selector in CSS (.grid-spaces with double height and lighter border)
            grid_space.dataset.value = `${x + 1}s`;
        }

        timeline.appendChild(grid_space);
    }
});


mixer.querySelectorAll('.audio-wrapper').forEach((elem) => {
    // const css = elem.style.cssText;
    // const color_property = css.split(";").find(style => style.includes("--_color"));
    // const color = color_property.slice(color_property.indexOf(":") + 1, color_property.indexOf(")") + 1);

    const color = get_custom_property("--_color", elem.style.cssText);
    const height = elem.getBoundingClientRect().height;

    let wavesurfer = WaveSurfer.create({
        container : elem,
        height : height,
        waveColor : `hsl(from ${color} h s calc(l * 1.25))`,
        progressColor : color, // var(--_color)
        cursorWidth : 0,
        url : "test_audio.ogg",
    });

    wavesurfer_map.set(elem.dataset.id, wavesurfer);

    wavesurfer.on("ready", () => {
        const track_width = track_list.getBoundingClientRect().width;
        const ratio = wavesurfer.getDuration() / track_duration;

        elem.style.width = `${ratio * track_width}px`;

        ready_wavesurfers++;
        if (ready_wavesurfers == total_wavesurfers) mixer.dataset.state = "ready";
    });

    wavesurfer.on("click", () => {
        // prevent default behavior of seeking
        wavesurfer.setTime(0);
    });

    wavesurfer.on("dblclick", () => {
        wavesurfer.play();
    });
});


scroll_container.addEventListener("mousedown", function(e) {
    e.preventDefault();
    demo_playing = false;
    const container_rect = this.getBoundingClientRect();
    const left_margin = container_rect.left;
    const cursor_left = this.scrollLeft + e.clientX - left_margin;
    
    if (e.target.offsetParent && e.target.offsetParent.classList.contains("audio-wrapper")) {
        draggable_audio = e.target.offsetParent;
        initial_audio_left = e.clientX - draggable_audio.getBoundingClientRect().left;
        draggable_audio.draggable = true;
    } else {
        slider.style.left = `${cursor_left}px`;
        audio_controls.dataset.state = "hidden";
    }
});


scroll_container.addEventListener("mouseup", function(e) {
    if (draggable_audio) {
        draggable_audio.draggable = false;
        draggable_audio = null;
        initial_audio_left = null;
    }
});


scroll_container.addEventListener("mousemove", function(e) {
    if (draggable_audio) {
        const container_rect = scroll_container.getBoundingClientRect();
        const left_margin = container_rect.left;
        // const top_margin = container_rect.top;

        const audio_rect = draggable_audio.getBoundingClientRect();

        const cursor_left = scroll_container.scrollLeft + e.clientX - left_margin; // cursor left, relative to scroll container
        if (!draggable_audio.style.left) {
            draggable_audio.style.left = `${audio_rect.left}px`;
        }

        const track_width = track_list.getBoundingClientRect().width;
        let new_audio_left = cursor_left - initial_audio_left;
        if (new_audio_left < 0) new_audio_left = 0;
        else if (new_audio_left + audio_rect.width > track_width) {
            new_audio_left = track_width - audio_rect.width;
        }
        
        draggable_audio.style.left = `${new_audio_left}px`;
    }
});


const zoom_increment = 10;
const tl_grid_min = 50;
const tl_grid_max = 100;
let supports_wheel = false;

function track_zoom(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();

    if (e.type == "wheel") supports_wheel = true;
    else if (supports_wheel) return;
    let grid_space_count = timeline.querySelectorAll(".grid-space").length;
    let delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;
    let tl_grid_width = parseInt(get_custom_property('--_timeline-width', mixer.style.cssText));
    let multiplier = null;

    if (delta > 0) {
        if (5 <= grid_space_count && grid_space_count < 10 && tl_grid_width == tl_grid_min) return; // zoom out limit
        else if ((tl_grid_width -= zoom_increment) < tl_grid_min) {
            // halve the number of .grid-spaces
            multiplier = 0.5;
            tl_grid_width = tl_grid_max;
        }
    } else if ((tl_grid_width += zoom_increment) > tl_grid_max) {
        if ((grid_space_count / track_duration) >= 8) return; // zoom in limit (10+ .grid-spaces per second)
        else {
            // double the number of .grid-spaces
            multiplier = 2;
            tl_grid_width = tl_grid_min;
        }
    }

    if (multiplier) {
        grid_space_count *= multiplier;

        const timeline_space_duration = (1 / multiplier) * parseFloat(get_custom_property('--_timeline-space-duration', mixer.style.cssText));
        let timeline_innerhtml = '';
    
        for (let x = 0; x < grid_space_count; x++) {
            const grid_space = document.createElement("div");
            grid_space.classList.add("grid-space");
    
            if (x % 5 == 4) grid_space.dataset.value = `${(x + 1) * (track_duration / grid_space_count)}s`;
            timeline_innerhtml += grid_space.outerHTML;
        }
    
        timeline.innerHTML = timeline_innerhtml;
        mixer.style.setProperty('--_timeline-space-duration', `${timeline_space_duration}`);
    }

    // need ratio of new track width to old track width to position audio properly with left
    let initial_track_width = track_list.getBoundingClientRect().width;
    
    mixer.style.setProperty('--_timeline-width', `${tl_grid_width}px`);

    // if the number of .grid-spaces is being changed, initial_track_width will be 2x what it should be (unchanged) for a split second
    if (multiplier) {
        // so in that case, update it to be the correct value
        initial_track_width = track_list.getBoundingClientRect().width;
    }

    mixer.querySelectorAll(".audio-wrapper").forEach((elem) => {
        const new_track_width = track_list.getBoundingClientRect().width;
        const ratio = wavesurfer_map.get(elem.dataset.id).getDuration() / track_duration;
        
        elem.style.width = `${ratio * new_track_width}px`;
        let offset = elem.style.left === "" ? 0 : parseFloat(elem.style.left);
        
        if (offset != 0) {
            elem.style.left = `${offset * (new_track_width / initial_track_width)}px`;
        }
    });

    // force slider to stay in the track if zoom out makes its left larger than track width
    if (parseInt(slider.style.left) > track_list.getBoundingClientRect().width) {
        slider.style.left = `${track_list.getBoundingClientRect().width}px`;
    }
}

scroll_container.addEventListener("wheel", track_zoom);
scroll_container.addEventListener("mousewheel", track_zoom);
scroll_container.addEventListener("DOMMouseScroll", track_zoom);


scroll_container.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // prevent standard context menu from appearing

    const audio_wrapper = e.target.offsetParent;
    if (audio_wrapper && audio_wrapper.classList.contains("audio-wrapper")) {
        // match volume slider accent color to audio color
        audio_controls.style.setProperty("--_accent-color", get_custom_property("--_color", audio_wrapper.style.cssText));

        // map current audio to #audio-controls
        audio_controls.dataset.audioid = audio_wrapper.dataset.id;

        // get #audio-controls menu width and height
        const audio_controls_size = audio_controls.getBoundingClientRect();
        const width = audio_controls_size.width;
        const height = audio_controls_size.height;

        // TODO try to place #audio-controls to the bottom and right of the cursor, adjust based on size

        // for now, just stick it to the bottom and right (it's late, i'm tired)
        audio_controls.style.left = `${e.clientX + 20}px`;
        audio_controls.style.top = `${e.clientY + 20}px`;

        // show controls
        audio_controls.dataset.state = "";
    }
});


function mute_audio(muted) {
    mixer.querySelector(`.audio-wrapper[data-id="${audio_controls.dataset.audioid}"]`).dataset.muted = `${muted}`;
    mute_button.disabled = muted;
    unmute_button.disabled = !muted;

    audio_controls.dataset.state = "hidden";
}


mute_button.addEventListener("mousedown", () => mute_audio(true));
unmute_button.addEventListener("mousedown", () => mute_audio(false));


crop_button.addEventListener("click", () => {
    
    audio_controls.dataset.state = "hidden";
});


play_button.addEventListener("click", () => {
    demo_playing = true;
    
    let track_width = parseInt(track_list.getBoundingClientRect().width);
    let slider_position = slider.style.left === "" ? 0 : parseInt(slider.style.left);
    slider.style.left = `${slider_position}px`;
    let audio_delays = [];

    mixer.querySelectorAll('.audio-wrapper:not([data-muted="true"])').forEach((elem) => {
        const audio_start = elem.style.left === "" ? 0 : parseInt(elem.style.left);
        const audio_end = audio_start + parseInt(elem.style.width);
        const wavesurfer = wavesurfer_map.get(elem.dataset.id);

        if (slider_position < audio_end) {
            let delay;
            // audio needs to be played
            if (slider_position > audio_start) {
                // slider is in the middle of current audio file, set playback position
                const audio_ratio = (slider_position - audio_start) / (audio_end - audio_start);
                wavesurfer.setTime(wavesurfer.getDuration() * audio_ratio);
                
                delay = 0;
            } else {
                // audio occurs later and needs a delay
                wavesurfer.setTime(0);
                
                const ratio = (audio_start - slider_position) / track_width;
                delay = ratio * track_duration * 1000; // convert s to ms
            }

            audio_delays.push([wavesurfer, delay]);
        }
    });

    // play audio outside of the config/preprocess forEach because setTime() takes a nonnegligible length of time to complete, even for small audio file sets
    // goal: reduce synchronization issues between audio progress relative to other files
    audio_delays.forEach((elem) => {
        setTimeout(() => {
            elem[0].play();
        }, elem[1]);
    });

    // duration, interval in ms
    const interval = 50;
    let remaining_duration = (track_width - slider_position) / track_width * track_duration * 1000;

    let expected = Date.now() + interval;

    // self-adjusting timer
    setTimeout(while_delay, interval);
    function while_delay() {
        let track_width = track_list.getBoundingClientRect().width; // continuously update to handle user zooming while audio playing
        let pixels_per_interval = track_width / track_duration * interval / 1000;
        let time_delta = Date.now() - expected;
        if (time_delta > interval) expected += time_delta;
        
        slider_position += pixels_per_interval;
        slider.style.left = `${slider_position}px`;

        // scroll with the slider as it's about to leave the view
        if (slider_position > (scroll_container.scrollLeft + (0.9 * scroll_container.getBoundingClientRect().width))) {
            scroll_container.scrollLeft = slider_position - (0.1 * scroll_container.getBoundingClientRect().width);
        }

        if (!demo_playing) {
            // user interrups playback, stop all tracks
            audio_delays.forEach((elem) => {
                elem[0].pause();
            });

            return;
        } else if ((remaining_duration -= interval) > 0) {
            // track hasn't finished, continue playing
            expected += interval;
            setTimeout(while_delay, Math.max(0, interval - time_delta));
        } else {
            // demo reached "EOF"
            demo_playing = false;
            slider.style.left = `${track_width}px`;

            return;
        }
    }
});