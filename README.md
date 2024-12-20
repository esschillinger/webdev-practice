# webdev-practice

A collection of static webpages/layouts/components/widgets/etc. to improve my HTML/CSS/JS. This will be a mix of replicating features or designs that I find interesting and design ideas that come to me. Essentially CodePen but on GitHub. I'm by no means great at CSS, but hopefully getting better every day!

Some of these components may be refined into their own repositories to allow for easier integration with your projects; if you see one you would like to use, let me know and I can do just that!

*Started Nov. 1, 2024*

*\* = in progress*

### audio-mix-ui\*

An interface for arranging, editing, and playing audio files. Right-click to mute audio and adjust volume, and zoom in or out within the tracks via `CTRL + mousewheel`. Track cropping/trimming currently being implemented.

Technically a bit of a misnomer, as audio mixing capabilities are not the primary focus of this tool, though I may add some in the future. This component is likely to become a separate repository.

### colorful-hero

A simple backdrop filter card over a colorful background that I thought looked nice and wanted to recreate.

### input_inner-styles

A component that imitates an `<input>` element and opens up its content to the DOM. Doesn't actually use any `<input>` elements, but rather a `<div>` with `contenteditable="true"` and a non-negligible amount of JS to keep everything in line. *Technically* finished[^1].

In this example, the user can mention/tag their friends within a plaintext message to share content. The mentions are styled separately to diffentiate them from the message body.

[^1]: One change I did want to make is to replace the username in a mention with the user's name after it loses focus. This in itself wasn't difficult, but there is one quirk that prevents me from keeping it in the current version: when the user tabs to the username, the event sequence is `focus -> blur -> focus` due to the programmatic text selection instead of just `focus`. Therefore, when the username is validated on `blur`, it doesn't recognize the username and unwraps the mention altogether. **If you're reading this and know a relatively simple solution, please let me know!** Trying not to overcomplicate things.

### tooltip\*

A basic tooltip on hover. I realized that after all of my CSS learning and practicing, I'd never actually designed my own tooltip before, which is something I remember struggling with some years ago before I started actually learning HTML/CSS.

Ironically, I didn't finish it before I got sidetracked.
