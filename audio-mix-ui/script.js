import WaveSurfer from './wavesurfer.esm.js'


const mixer = document.querySelector('.mixer');
const scroll_container = document.querySelector('.mixer .scroll-wrapper');
const slider = document.querySelector('.mixer .slider');
const timeline = document.querySelector('.mixer .timeline');
const track_list = document.querySelector('.mixer .track-list');

let wavesurfers = [];

document.addEventListener("DOMContentLoaded", () => {
    slider.style.height = `${track_list.getBoundingClientRect().height + timeline.getBoundingClientRect().height}px`;
});


document.querySelectorAll('.audio-wrapper').forEach((elem) => {
    const css = elem.style.cssText;
    const color_property = css.split(";").find(style => style.includes("--_color"));
    const color = color_property.slice(color_property.indexOf(":") + 1, color_property.indexOf(")") + 1);

    const height = elem.getBoundingClientRect().height;

    let wavesurfer = WaveSurfer.create({
        container : elem,
        height: height,
        waveColor: `hsl(from ${color} h s calc(l * 1.25) )`,
        progressColor : color, // var(--_color)
        cursorWidth: 0,
        url : "test_audio.ogg",
    });

    wavesurfers.push(wavesurfer);

    wavesurfer.on("ready", () => {
        console.log(wavesurfer.getDuration());
    });

    // wavesurfer.on("interaction", () => {
    //     wavesurfer.play();
    // });
});


let draggable_audio;
let initial_audio_left;


scroll_container.addEventListener("mousedown", function(e) {
    e.preventDefault();
    const container_rect = this.getBoundingClientRect();
    const left_margin = container_rect.left;

    const cursor_left = this.scrollLeft + e.clientX - left_margin;
    
    // 
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
        // console.log(cursor_left, audio_left, cursor_left - audio_left);
    }
});