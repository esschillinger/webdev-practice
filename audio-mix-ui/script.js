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
    const color = color_property.slice(color_property.indexOf(":") + 1, color_property.indexOf(";"));

    const h = parseInt(color.slice(color.indexOf("(") + 1, color.indexOf(",")));
    const s = parseInt(color.slice(color.indexOf(",") + 2, color.indexOf("%,")));
    const l = parseInt(color.slice(color.indexOf("%,") + 3, color.indexOf("%)")));

    const height = elem.getBoundingClientRect().height;

    let wavesurfer = WaveSurfer.create({
        container : elem,
        height: height,
        waveColor : `hsl(${h}, ${s}%, ${l * 1.25}%)`, // var(--_color-lighter)
        progressColor : color, // var(--_color)
        cursorColor: 'transparent',
        url : 'test_audio.ogg',
    });

    wavesurfers.push(wavesurfer);

    wavesurfer.on('interaction', () => {
        wavesurfer.play();
    });
});


scroll_container.addEventListener('click', function(e) {
    const container_rect = this.getBoundingClientRect();
    const left_margin = container_rect.left;
    // const top_margin = container_rect.top;

    const relative_left = this.scrollLeft + e.clientX - left_margin;
    slider.style.left = `${relative_left}px`;
})