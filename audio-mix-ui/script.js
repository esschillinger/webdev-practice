import WaveSurfer from './wavesurfer.esm.js'


const mixer = document.querySelector(".mixer");
const scroll_container = mixer.querySelector(".scroll-wrapper");
const slider = mixer.querySelector(".slider");
const timeline = mixer.querySelector(".timeline");
const track_list = mixer.querySelector(".track-list");
const play_button = mixer.querySelector("button:has(.icon__play)");

const audio_controls = document.querySelector("#audio-controls");
const mute_button = audio_controls.querySelector("#mute");
const unmute_button = audio_controls.querySelector("#unmute");
const crop_button = audio_controls.querySelector("#crop");
const restore_button = audio_controls.querySelector("#restore");
const volume = audio_controls.querySelector("#volume");

const mixer_toolbar = mixer.querySelector(".mixer__toolbar");
const apply_change_button = mixer_toolbar.querySelector("button:has(.icon__check)");
const discard_change_button = mixer_toolbar.querySelector("button:has(.icon__xmark)");
const zoom_in_button = mixer_toolbar.querySelector("button:has(.icon__zoom-in)");
const zoom_out_button = mixer_toolbar.querySelector("button:has(.icon__zoom-out)");

const phantom_audio = document.getElementById("phantom-audio"); // 20Hz tone to keep audio drivers awake, fix sync issues

let audio_map = new Map(); // audio_id : { wavesurfer, delay, start, end, volume, muted, delay (temp) }
let total_wavesurfers = mixer.querySelectorAll('.audio-wrapper').length;
let ready_wavesurfers = 0;
let track_duration;

let dragging_audio;
let initial_audio_left;

let demo_playing = false;

const crop_bar_width = 30;
let initial_crop_bar_left;


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


mixer.querySelectorAll(".audio-wrapper").forEach((elem) => {
    const color = get_custom_property("--_color", elem.style.cssText);
    const height = elem.getBoundingClientRect().height;

    let wavesurfer = WaveSurfer.create({
        container : elem,
        height : height,
        waveColor : `hsl(from ${color} h s calc(l * 1.25))`,
        progressColor : color, // var(--_color)
        cursorWidth : 0,
        url : elem.dataset.file,
        backend: 'MediaElement'
    });

    let wavesurfer_map = new Map();
    wavesurfer_map.set("wavesurfer", wavesurfer); // wavesurfer object with waveform
    wavesurfer_map.set("delay", 0); // plays at the start of the demo
    wavesurfer_map.set("start", 0); // start of audio (nonzero only if cropped)
    wavesurfer_map.set("end", -1); // end of audio (!= -1 only if cropped)
    wavesurfer_map.set("volume", 1); // [0, 1], same as <audio> element
    wavesurfer_map.set("muted", false); // pretty self-explanatory

    audio_map.set(elem.dataset.id, wavesurfer_map);

    wavesurfer.on("ready", () => {
        const track_width = track_list.getBoundingClientRect().width;
        const ratio = wavesurfer.getDuration() / track_duration;
        const audio_width = ratio * track_width;

        elem.style.setProperty("--_audio-width", `${audio_width}px`);

        const left = wavesurfer_map.get("start") / wavesurfer.getDuration() * audio_width;
        const right = wavesurfer_map.get("end") == -1 ? audio_width : wavesurfer_map.get("end") / wavesurfer.getDuration() * audio_width;

        elem.style.setProperty("--_left", `${left}px`);
        elem.style.setProperty("--_right", `${right}px`);

        ready_wavesurfers++;
        if (ready_wavesurfers == total_wavesurfers) mixer.dataset.state = "ready";
    });

    wavesurfer.on("click", () => {
        // prevent default seek behavior
        wavesurfer.setTime(0);
    });

    wavesurfer.on("dblclick", () => {
        wavesurfer.play();
    });
});


function move_audio(e) {
    const container_rect = scroll_container.getBoundingClientRect();
    const left_margin = container_rect.left;
    const audio_rect = dragging_audio.getBoundingClientRect();
    const cursor_left = scroll_container.scrollLeft + e.clientX - left_margin; // cursor left, relative to scroll container
    const track_width = track_list.getBoundingClientRect().width;
    const crop_left = parseInt(get_custom_property("--_left", dragging_audio.style.cssText));
    const crop_right = parseInt(get_custom_property("--_right", dragging_audio.style.cssText));

    let min_left = 0;
    let max_left = track_width - audio_rect.width;

    if (dragging_audio.querySelector(".crop-tool").dataset.state == "inactive") {
        if (crop_left > 0) min_left = -1 * crop_left;
        if (crop_right < audio_rect.width) max_left = track_width - crop_right;
    }
    
    if (!dragging_audio.style.left) {
        dragging_audio.style.left = `${audio_rect.left}px`;
    }

    let new_audio_left = cursor_left - initial_audio_left;

    if (new_audio_left < min_left) new_audio_left = min_left;
    else if (new_audio_left > max_left) new_audio_left = max_left;

    dragging_audio.style.left = `${new_audio_left}px`;
}


function prevent_audio_move() {
    if (dragging_audio) {
        dragging_audio = null;
        initial_audio_left = null;
        
        track_list.removeEventListener("mousemove", move_audio);
    }
}


function crop_audio_from_left(e) {
    const audio_rect = cropping_audio.getBoundingClientRect();
    const cursor_pos = e.clientX - audio_rect.left;
    const crop_tool = cropping_audio.querySelector(".crop-tool");
    const max_left = parseInt(get_custom_property("--_right", cropping_audio.style.cssText));

    let new_left = cursor_pos - initial_crop_bar_left;

    if (new_left > max_left) new_left = max_left;
    else if (new_left < 0) new_left = 0;

    let crop_left_overflow = 0;

    if (new_left < crop_bar_width) crop_left_overflow = new_left;
    else crop_left_overflow = crop_bar_width;

    cropping_audio.style.setProperty("--_left", `${new_left}px`);
    crop_tool.style.setProperty("--_crop-left-overflow", `${crop_left_overflow}px`);
}


function crop_audio_from_right(e) {
    const audio_rect = cropping_audio.getBoundingClientRect();
    const cursor_pos = e.clientX - audio_rect.left;
    const crop_tool = cropping_audio.querySelector(".crop-tool");
    const min_left = parseInt(get_custom_property("--_left", cropping_audio.style.cssText));

    let new_right = cursor_pos - initial_crop_bar_left;

    if (new_right < min_left) new_right = min_left;
    else if (new_right > audio_rect.width) new_right = audio_rect.width;

    let crop_right_overflow = 0;

    if (new_right > (audio_rect.width - crop_bar_width)) crop_right_overflow = audio_rect.width - new_right;
    else crop_right_overflow = crop_bar_width;

    cropping_audio.style.setProperty("--_right", `${new_right}px`);
    crop_tool.style.setProperty("--_crop-right-overflow", `${crop_right_overflow}px`);
}


function prevent_audio_crop() {
    if (cropping_audio) {
        initial_crop_bar_left = null;
        cropping_audio.removeEventListener("mousemove", crop_audio_from_left);
        cropping_audio.removeEventListener("mousemove", crop_audio_from_right);
        
        // cropping_audio = null;
    }
}


scroll_container.addEventListener("mousedown", function(e) {
    e.preventDefault();
    demo_playing = false;
    const container_rect = this.getBoundingClientRect();
    const left_margin = container_rect.left;
    const cursor_left = this.scrollLeft + e.clientX - left_margin;

    if (!e.target.offsetParent || !["audio-wrapper", "crop-tool"].some(s => e.target.offsetParent.classList.contains(s) || e.target.offsetParent.parentNode.classList.contains(s))) {
        if (cursor_left < track_list.getBoundingClientRect().width) {
            slider.style.left = `${cursor_left}px`;
        }
    }

    audio_controls.dataset.state = "hidden";
});


let cropping_audio;

track_list.addEventListener("mousedown", function(e) {
    if (e.target.offsetParent && e.target.offsetParent.classList.contains("audio-wrapper")) {
        dragging_audio = e.target.offsetParent;
        initial_audio_left = e.clientX - dragging_audio.getBoundingClientRect().left;
        
        track_list.addEventListener("mousemove", move_audio);

    } else if (e.target.classList.contains("crop__left-handle") || e.target.offsetParent.classList.contains("crop__left-handle")) {
        initial_crop_bar_left = e.clientX - cropping_audio.querySelector(".crop__left-handle").getBoundingClientRect().right;
        
        cropping_audio.addEventListener("mousemove", crop_audio_from_left);
        cropping_audio.addEventListener("mouseup", prevent_audio_crop);
        cropping_audio.addEventListener("mouseleave", prevent_audio_crop);

    } else if (e.target.classList.contains("crop__right-handle") || e.target.offsetParent.classList.contains("crop__right-handle")) {
        initial_crop_bar_left = e.clientX - cropping_audio.querySelector(".crop__right-handle").getBoundingClientRect().left;
        
        cropping_audio.addEventListener("mousemove", crop_audio_from_right);
        cropping_audio.addEventListener("mouseup", prevent_audio_crop);
        cropping_audio.addEventListener("mouseleave", prevent_audio_crop);
    }
});


track_list.addEventListener("mouseup", prevent_audio_move);
track_list.addEventListener("mouseleave", prevent_audio_move);


apply_change_button.addEventListener("click", () => {
    const audio_id = cropping_audio.dataset.id;
    const audio_width = cropping_audio.getBoundingClientRect().width; // xonar
    const wavesurfer = audio_map.get(audio_id).get("wavesurfer");
    const crop_left = parseInt(get_custom_property("--_left", cropping_audio.style.cssText));
    const crop_right = parseInt(get_custom_property("--_right", cropping_audio.style.cssText));
    let start;
    let end;

    // left side is cropped
    if (crop_left > 0) {
        start = Math.floor(crop_left / audio_width * wavesurfer.getDuration() * 1000); // convert to ms
    } else {
        start = 0; // reset if audio used to be cropped
    }
    
    // right side is cropped
    if (crop_right < audio_width) {
        end = Math.ceil(crop_right / audio_width * wavesurfer.getDuration() * 1000); // convert to ms
    } else {
        end = -1; // reset if audio used to be cropped
    }

    audio_map.get(audio_id).set("start", start);
    audio_map.get(audio_id).set("end", end);

    cropping_audio.classList.add("cropped");
    cropping_audio.querySelector(".crop-tool").dataset.state = "inactive";
});


function keep_audio_within_bounds(audio_id) {
    const audio_wrapper = track_list.querySelector(`.audio-wrapper[data-id="${audio_id}"]`);
    const audio_left = audio_wrapper.style.left === "" ? 0 : parseInt(audio_wrapper.style.left);
    const audio_width = audio_wrapper.getBoundingClientRect().width;
    const track_width = track_list.getBoundingClientRect().width;

    if (audio_left < 0) audio_wrapper.style.left = "0px";
    else if (audio_left + audio_width > track_width) audio_wrapper.style.left = `${track_width - audio_width}px`;
}


function revert_crop(audio_id) {
    const audio_wrapper = track_list.querySelector(`.audio-wrapper[data-id="${audio_id}"]`);
    const audio_width = audio_wrapper.getBoundingClientRect().width;
    const audio_data = audio_map.get(audio_id);
    const duration = audio_data.get("wavesurfer").getDuration() * 1000;
    const start = audio_data.get("start");
    let end = audio_data.get("end");

    if (end == -1) end = duration;

    const left = start / duration * audio_width;
    const right = end / duration * audio_width;

    audio_wrapper.style.setProperty("--_left", `${left}px`);
    audio_wrapper.style.setProperty("--_right", `${right}px`);

    const crop_tool = audio_wrapper.querySelector(".crop-tool");
    let left_overflow = crop_bar_width;
    let right_overflow = crop_bar_width;

    
    if (left < crop_bar_width) left_overflow = left;
    if (right > (audio_width - crop_bar_width)) right_overflow = audio_width - right;
    
    crop_tool.style.setProperty("--_crop-left-overflow", `${left_overflow}px`);
    crop_tool.style.setProperty("--_crop-right-overflow", `${right_overflow}px`);

    keep_audio_within_bounds(audio_id);
}


discard_change_button.addEventListener("click", () => {
    revert_crop(cropping_audio.dataset.id);

    cropping_audio.querySelector(".crop-tool").dataset.state = "inactive";
});


const zoom_increment = 10;
const tl_grid_min = 50;
const tl_grid_max = 100;
let supports_wheel = false;

function track_zoom_with_wheel(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();

    if (e.type == "wheel") supports_wheel = true;
    else if (supports_wheel) return;

    let delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;

    if (delta > 0) track_zoom(false); // scroll up, zoom out
    else track_zoom(true); // scroll down, zoom in
}

function track_zoom(zoom_in) {
    let grid_space_count = timeline.querySelectorAll(".grid-space").length;
    let tl_grid_width = parseInt(get_custom_property('--_timeline-width', mixer.style.cssText));
    let multiplier = null;

    if (!zoom_in) {
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

    const new_track_width = track_list.getBoundingClientRect().width;

    mixer.querySelectorAll(".audio-wrapper").forEach((elem) => {
        const audio_ratio = audio_map.get(elem.dataset.id).get("wavesurfer").getDuration() / track_duration;
        const initial_audio_width = parseInt(get_custom_property("--_audio-width", elem.style.cssText));
        const new_audio_width = audio_ratio * new_track_width;
        const crop_ratio = new_audio_width / initial_audio_width;

        elem.style.setProperty("--_audio-width", `${new_audio_width}px`);
        let offset = elem.style.left === "" ? 0 : parseFloat(elem.style.left);
        
        if (offset != 0) {
            elem.style.left = `${offset * (new_track_width / initial_track_width)}px`;
        }

        const initial_crop_left = parseInt(get_custom_property("--_left", elem.style.cssText));
        const initial_crop_right = parseInt(get_custom_property("--_right", elem.style.cssText));

        elem.style.setProperty("--_left", `${initial_crop_left * crop_ratio}px`);
        elem.style.setProperty("--_right", `${initial_crop_right * crop_ratio}px`);
    });

    const slider_position = slider.style.left === "" ? 0 : parseInt(slider.style.left);
    const new_slider_position = slider_position * new_track_width / initial_track_width;

    slider.style.left = `${new_slider_position}px`;

    // force slider to stay in the track if zoom out makes its left larger than track width
    // deprecated after adding slider position adjustment, can probably safely remove this
    if (new_slider_position > new_track_width) {
        slider.style.left = `${new_track_width}px`;
    }
}

scroll_container.addEventListener("wheel", track_zoom_with_wheel);
scroll_container.addEventListener("mousewheel", track_zoom_with_wheel);
scroll_container.addEventListener("DOMMouseScroll", track_zoom_with_wheel);


zoom_in_button.addEventListener("click", () => track_zoom(true));
zoom_out_button.addEventListener("click", () => track_zoom(false));


scroll_container.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // prevent standard context menu from appearing

    const audio_wrapper = e.target.offsetParent;
    if (audio_wrapper && audio_wrapper.classList.contains("audio-wrapper")) {
        // map current audio to #audio-controls
        const audio_id = audio_wrapper.dataset.id;
        audio_controls.dataset.audioid = audio_id;

        // set values to match the focused audio state
        const muted = audio_map.get(audio_id).get("muted");
        mute_button.disabled = muted;
        unmute_button.disabled = !muted;

        volume.value = audio_map.get(audio_id).get("volume");

        // match volume slider accent color to audio color
        audio_controls.style.setProperty("--_accent-color", get_custom_property("--_color", audio_wrapper.style.cssText));

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
    audio_map.get(audio_controls.dataset.audioid).set("muted", muted);
    mute_button.disabled = muted;
    unmute_button.disabled = !muted;

    audio_controls.dataset.state = "hidden";
}


mute_button.addEventListener("mousedown", () => mute_audio(true));
unmute_button.addEventListener("mousedown", () => mute_audio(false));


crop_button.addEventListener("click", () => {
    if (cropping_audio && cropping_audio.dataset.id != audio_controls.dataset.audioid) {
        // deactivate crop if another crop tool is activated
        cropping_audio.querySelector(".crop-tool").dataset.state = "inactive";
    }

    cropping_audio = track_list.querySelector(`.audio-wrapper[data-id="${audio_controls.dataset.audioid}"]`);
    const crop_tool = cropping_audio.querySelector(".crop-tool");

    if (crop_tool.dataset.state == "active") {
        revert_crop(cropping_audio.dataset.id);

        crop_tool.dataset.state = "inactive";
        cropping_audio = null;

    } else {
        crop_tool.dataset.state = "active";

        keep_audio_within_bounds(cropping_audio.dataset.id);
    }

    audio_controls.dataset.state = "hidden";
});


restore_button.addEventListener("click", () => {
    const audio_id = audio_controls.dataset.audioid;

    audio_map.get(audio_id).set("start", 0);
    audio_map.get(audio_id).set("end", -1);

    revert_crop(audio_id);

    track_list.querySelector(`.audio-wrapper[data-id="${audio_id}"]`).classList.remove("cropped");
    audio_controls.dataset.state = "hidden";
});


volume.addEventListener("input", () => {
    audio_map.get(audio_controls.dataset.audioid).set("volume", volume.value);
    audio_map.get(audio_controls.dataset.audioid).get("wavesurfer").setVolume(volume.value);
});


document.addEventListener("click", () => {
    if (audio_controls !== document.activeElement && !audio_controls.contains(document.activeElement)) {
        audio_controls.dataset.state = "hidden";
    }
});


play_button.addEventListener("click", () => {
    demo_playing = true;
    
    let track_width = parseInt(track_list.getBoundingClientRect().width);
    let slider_position = slider.style.left === "" ? 0 : parseInt(slider.style.left);
    slider.style.left = `${slider_position}px`;

    let play_audio = new Map();

    mixer.querySelectorAll('.audio-wrapper:not([data-muted="true"])').forEach((elem) => {
        const audio_width = parseInt(get_custom_property("--_audio-width", elem.style.cssText));
        const left_crop = parseInt(get_custom_property("--_left", elem.style.cssText));
        const right_crop = parseInt(get_custom_property("--_right", elem.style.cssText));
        const audio_data = audio_map.get(elem.dataset.id);
        const wavesurfer = audio_data.get("wavesurfer");
        
        let audio_start = elem.style.left === "" ? 0 : parseInt(elem.style.left);
        audio_start += left_crop;

        const audio_end = audio_start + right_crop - left_crop;

        // set audio delays
        if (slider_position < audio_end) {
            let delay;
            // audio needs to be played
            play_audio.set(elem.dataset.id, true);

            if (slider_position > audio_start) {
                // slider is in the middle of current audio file, set playback position
                // const audio_ratio = (slider_position - audio_start) / (audio_end - audio_start);
                const audio_ratio = (slider_position - audio_start + left_crop) / (audio_width);
                wavesurfer.setTime(wavesurfer.getDuration() * audio_ratio);
                
                delay = 0;
            } else {
                // audio occurs later and needs a delay
                wavesurfer.setTime(audio_data.get("start") / 1000);
                
                const ratio = (audio_start - slider_position) / track_width;
                delay = ratio * track_duration * 1000; // convert s to ms
            }

            audio_map.get(elem.dataset.id).set("delay", delay);
        }
    });

    // play audio outside of the config/preprocess forEach because setTime() takes a nonnegligible length of time to complete, even for small audio file sets
    // goal: reduce synchronization issues between audio progress relative to other files
    // okay turns out the main problem is the audio drivers going to sleep but this still makes sense to do
    let timeouts = [];

    function play_track() {
        for (const [k, v] of audio_map.entries()) {
            if (!v.get("muted") && play_audio.get(k)) {
                const wavesurfer = v.get("wavesurfer");
                const end = v.get("end");
                const delay = v.get("delay");
                const current_time = wavesurfer.getCurrentTime() * 1000;
    
                const t = setTimeout(() => {
                    wavesurfer.play();
                }, delay);
                
                timeouts.push(t);
    
                if (end != -1) {
                    const t2 = setTimeout(() => {
                        wavesurfer.pause();
                    }, delay + end - current_time);
    
                    timeouts.push(t2);
                }
            }
        }
    
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
                for (const [k, v] of audio_map.entries()) {
                    v.get("wavesurfer").pause();
                }
    
                // prevent any audio playback not yet triggered from firing
                timeouts.forEach((t) => {
                    clearTimeout(t);
                });
    
                phantom_audio.pause();
                phantom_audio.currentTime = 0;
    
                return;
            } else if ((remaining_duration -= interval) > 0) {
                // track hasn't finished, continue playing
                expected += interval;
                setTimeout(while_delay, Math.max(0, interval - time_delta));
            } else {
                // demo reached "EOF"
                demo_playing = false;
                slider.style.left = `${track_width}px`;
    
                phantom_audio.pause();
                phantom_audio.currentTime = 0;
    
                return;
            }
        }
    }

    function wait_for_drivers() {
        if (phantom_audio.currentTime > 0) {
            phantom_audio.removeEventListener("timeupdate", wait_for_drivers);
            play_track();
        }
    }

    phantom_audio.play();
    phantom_audio.addEventListener("timeupdate", wait_for_drivers);
});