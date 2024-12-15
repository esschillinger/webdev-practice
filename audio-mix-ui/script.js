import WaveSurfer from './wavesurfer.esm.js'


const mixer = document.querySelector('.mixer');
const scroll_container = document.querySelector('.mixer .scroll-wrapper');
const slider = document.querySelector('.mixer .slider');
const timeline = document.querySelector('.mixer .timeline');
const track_list = document.querySelector('.mixer .track-list');
const play_button = document.querySelector('button.play-button');

let wavesurfer_map = new Map();
let total_wavesurfers = document.querySelectorAll('.mixer .audio-wrapper').length;
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
            grid_space.dataset.value = `${x+1}s`;
        }

        timeline.appendChild(grid_space);
    }
});


document.querySelectorAll('.mixer .audio-wrapper').forEach((elem) => {
    // const css = elem.style.cssText;
    // const color_property = css.split(";").find(style => style.includes("--_color"));
    // const color = color_property.slice(color_property.indexOf(":") + 1, color_property.indexOf(")") + 1);

    const color = get_custom_property("--_color", elem.style.cssText);
    const height = elem.getBoundingClientRect().height;

    let wavesurfer = WaveSurfer.create({
        container : elem,
        height : height,
        waveColor : `hsl(from ${color} h s calc(l * 1.25) )`,
        progressColor : color, // var(--_color)
        cursorWidth : 0,
        url : "test_audio.ogg",
    });

    wavesurfer_map.set(elem.dataset.id, wavesurfer);

    wavesurfer.on("ready", () => {
        const track_width = track_list.getBoundingClientRect().width;
        const ratio = wavesurfer.getDuration() / track_duration;
        
        elem.style.width = ratio * track_width;

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
            draggable_audio.style.left = audio_rect.left;
        }

        const track_width = track_list.getBoundingClientRect().width;
        let new_audio_left = cursor_left - initial_audio_left;
        if (new_audio_left < 0) new_audio_left = 0;
        else if (new_audio_left + audio_rect.width > track_width) {
            new_audio_left = track_width - audio_rect.width;
        }
        
        draggable_audio.style.left = new_audio_left;
    }
});


play_button.addEventListener("click", () => {
    demo_playing = true;
    
    const track_width = parseInt(track_list.getBoundingClientRect().width);
    let slider_position = slider.style.left === "" ? 0 : parseInt(slider.style.left);
    slider.style.left = `${slider_position}px`;
    let audio_delays = [];

    document.querySelectorAll('.mixer .audio-wrapper').forEach((elem) => {
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

    const polling_rate = 50; // in ms
    const pixels_per_polling_rate = track_width / track_duration * polling_rate / 1000;
    const remaining_duration = (track_width - slider_position) / track_width * track_duration * 1000;

    (function while_delay(duration, polling_rate) {
        setTimeout(() => {
            slider_position += pixels_per_polling_rate;
            slider.style.left = `${slider_position}px`;
            console.log(slider.style.left, duration, polling_rate);

            if (!demo_playing) {
                // pause all tracks if play is stopped from user interaction
                audio_delays.forEach((elem) => {
                    elem[0].pause();
                });
            } else if ((duration -= polling_rate) > 0) {
                // continue playing if there's audio left in the demo
                while_delay(duration, polling_rate);
            } else {
                // demo reached "EOF"
                demo_playing = false;
                slider.style.left = `${track_width}px`;
            }
        }, polling_rate);
    })(remaining_duration, polling_rate); // duration, polling_rate in ms
});